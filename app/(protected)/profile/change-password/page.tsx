"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import toast from "react-hot-toast";
import PasswordTextField from "@/components/common/PasswordTextField";

export default function ChangePasswordPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();



    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("รหัสผ่านใหม่ไม่ตรงกัน");
      return;
    }

    if (formData.newPassword.length < 6) {
      toast.error("รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร");
      return;
    }

    setLoading(true);

    try {
      const supabase = createClient();

      const { error: signInError } = await supabase.auth.signInWithPassword({
  email: (await supabase.auth.getUser()).data.user?.email ?? "",
  password: formData.currentPassword,
});

if (signInError) {
  toast.error("รหัสผ่านปัจจุบันไม่ถูกต้อง");
  setLoading(false);
  return;
}

      const { error } = await supabase.auth.updateUser({
        password: formData.newPassword,
      });

      if (error) throw error;

      toast.success("เปลี่ยนรหัสผ่านสำเร็จ");
      router.push("/more");
    } catch (error) {
      console.log("Error changing password:", error);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
        <button onClick={() => router.back()}>
          <ChevronLeft size={24} />
        </button>
        <h1 className="text-xl font-bold">เปลี่ยนรหัสผ่าน</h1>
      </div>

      <form onSubmit={handleSubmit} className="p-6">
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รหัสผ่านปัจจุบัน
            </label>
            <PasswordTextField
              name="currentPassword"
              placeholder="รหัสผ่านปัจจุบัน"
              value={formData.currentPassword}
              onChange={(e) => setFormData({ ...formData, currentPassword: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              รหัสผ่านใหม่
            </label>
            <PasswordTextField
              name="newPassword"
              placeholder="รหัสผ่านใหม่"
              value={formData.newPassword}
              onChange={(e) => setFormData({ ...formData, newPassword: e.target.value })}
              required
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-700 mb-2">
              ยืนยันรหัสผ่านใหม่
            </label>
            <PasswordTextField
              name="confirmPassword"
              placeholder="ยืนยันรหัสผ่านใหม่"
              value={formData.confirmPassword}
              onChange={(e) => setFormData({ ...formData, confirmPassword: e.target.value })}
              required
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full mt-8 py-3 bg-black text-white font-bold rounded-full hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? "กำลังเปลี่ยนรหัสผ่าน..." : "บันทึกการเปลี่ยนแปลง"}
        </button>
      </form>
    </div>
  );
}
