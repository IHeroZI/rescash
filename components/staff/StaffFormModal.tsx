"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import Image from "next/image";
import { Upload } from "lucide-react";
import toast from "react-hot-toast";
import type { Staff } from "@/lib/hooks/useStaff";

interface StaffFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  staff?: Staff | null;
}

export default function StaffFormModal({
  isOpen,
  onClose,
  onSuccess,
  staff = null,
}: StaffFormModalProps) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [saving, setSaving] = useState(false);

  const isEditMode = !!staff;

  useEffect(() => {
    console.log("[StaffFormModal] staff prop:", staff);
    if (isOpen && staff) {
      setName(staff.name);
      setEmail(staff.email);
      // รองรับทั้ง phone กับ phone_number
      // @ts-expect-error: รองรับกรณีที่ field เป็น phone (raw จาก db)
      setPhoneNumber(staff.phone || "");
      setImagePreview(staff.profile_image_url || "");
    } else if (!isOpen) {
      // Reset form
      setName("");
      setEmail("");
      setPhoneNumber("");
      setImageFile(null);
      setImagePreview("");
    }
  }, [isOpen, staff]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `profiles/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleSubmit = async () => {
    if (!email.trim()) {
      toast.error("กรุณาระบุอีเมล");
      return;
    }

    // Validation for edit mode
    if (isEditMode) {
      if (!name.trim()) {
        toast.error("กรุณาระบุชื่อ");
        return;
      }
      if (!phoneNumber.trim()) {
        toast.error("กรุณาระบุเบอร์โทรศัพท์");
        return;
      }
    }

    try {
      setSaving(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      if (isEditMode) {
        // Update existing staff
        let imageUrl = staff.profile_image_url;

        // Upload image if selected
        if (imageFile) {
          imageUrl = await uploadImage(imageFile);
        }

        const { error } = await supabase
          .from("users")
          .update({
            name: name.trim(),
            email: email.trim(),
            phone: phoneNumber.trim(),
            profile_image_url: imageUrl,
          })
          .eq("user_id", staff.user_id);

        if (error) throw error;
        toast.success("แก้ไขข้อมูลสำเร็จ");
      } else {
        // Add new staff - Check if user exists by email
        const { data: user, error: findError } = await supabase
          .from("users")
          .select("*")
          .eq("email", email.trim())
          .single();

        if (findError || !user) {
          toast.error("ไม่พบผู้ใช้งานที่มีอีเมลนี้ในระบบ");
          setSaving(false);
          return;
        }

        // Update role to staff
        const { error: updateError } = await supabase
          .from("users")
          .update({ role: "staff" })
          .eq("user_id", user.user_id);

        if (updateError) throw updateError;

        toast.success("เพิ่มพนักงานสำเร็จ");
      }

      onSuccess();
      onClose();
    } catch (error: unknown) {
      console.log("Error saving staff:", error);
      if (error instanceof Error) {
        toast.error(`เกิดข้อผิดพลาด: ${error.message}`);
      } else {
        toast.error("เกิดข้อผิดพลาดในการบันทึก");
      }
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={isEditMode ? "แก้ไขข้อมูลพนักงาน" : "เพิ่มพนักงานใหม่"}
    >
      <div className="space-y-4">
        {isEditMode ? (
          <>
            {/* Profile Image */}
            <div className="flex flex-col items-center gap-3">
              <div className="relative w-24 h-24 rounded-full overflow-hidden bg-gray-200">
                {imagePreview ? (
                  <Image
                    src={imagePreview}
                    alt="Profile preview"
                    fill
                    className="object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-4xl font-bold text-gray-400">
                    {name.charAt(0).toUpperCase() || "?"}
                  </div>
                )}
              </div>
              <label className="cursor-pointer flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                <Upload size={18} />
                <span>เลือกรูปภาพ</span>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </label>
            </div>

            {/* Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ชื่อ-นามสกุล
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="กรอกชื่อ-นามสกุล"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            {/* Email */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                disabled={isEditMode}
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
            </div>

            {/* Phone Number */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                เบอร์โทรศัพท์
              </label>
              <input
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="0812345678"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </>
        ) : (
          <>
            {/* Email only for adding staff */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                อีเมล
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <p className="text-xs text-gray-500 mt-1">
                กรอกอีเมลของผู้ใช้งานที่มีอยู่ในระบบเพื่ออัปเกรดเป็นพนักงาน
              </p>
            </div>
          </>
        )}

        {/* Action buttons */}
        <div className="flex gap-3 pt-4">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : isEditMode ? "บันทึก" : "เพิ่ม"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
