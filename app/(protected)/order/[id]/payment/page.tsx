"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Upload, X } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useOrderDetail } from "@/lib/hooks/useOrderDetail";
import { createClient } from "@/lib/supabase/client";
import Header from "@/components/common/Header";
import ImageViewer from "@/components/order/ImageViewer";
import toast from "react-hot-toast";

export default function PaymentPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { userData } = useUser();
  const unwrappedParams = use(params);
  const orderId = parseInt(unwrappedParams.id);
  const { order, loading } = useOrderDetail(orderId);
  
  const [slipFile, setSlipFile] = useState<File | null>(null);
  const [slipPreview, setSlipPreview] = useState<string>("");
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setSlipFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setSlipPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadSlip = async (file: File): Promise<string> => {
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${orderId}-${Date.now()}.${fileExt}`;
    const filePath = `slips/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleConfirmPayment = async () => {
    if (!slipFile && !order?.slip_url) {
      toast.error("กรุณาแนบสลิปการโอนเงิน");
      return;
    }

    try {
      setUploading(true);
      const supabase = createClient();

      let slipUrl = order?.slip_url || "";

      // Upload new slip if selected
      if (slipFile) {
        slipUrl = await uploadSlip(slipFile);
      }

      // Update order status
      const { error } = await supabase
        .from("order")
        .update({
          slip_url: slipUrl,
          order_status: "awaiting_admin_review",
          update_datetime: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (error) throw error;

      toast.success("ยืนยันการชำระเงินสำเร็จ");
      router.push(`/order/${orderId}`);
    } catch (error) {
      console.error("Error confirming payment:", error);
      toast.error("เกิดข้อผิดพลาดในการยืนยันการชำระเงิน");
    } finally {
      setUploading(false);
    }
  };

  if (loading || !userData || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  const displaySlip = slipPreview || order.slip_url;
  const appointmentTime = new Date(order.appointment_time);
  const paymentDeadline = new Date(appointmentTime.getTime() - 12 * 60 * 60 * 1000);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="รอชำระเงิน" backHref={`/order/${orderId}`} showNotificationIcon={true} />

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4 pb-6">
        {/* Warning */}
        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
          <p className="text-sm text-yellow-800 font-medium">
            ⚠️ กรุณาชำระเงินก่อน 12 ชั่วโมงของวัน/เวลารับอาหาร
          </p>
          <p className="text-xs text-yellow-700 mt-1">
            หมดเขต: {paymentDeadline.toLocaleString("th-TH")}
          </p>
        </div>

        {/* QR Code */}
        {order.qr_url && (
          <div className="bg-white p-6 rounded-lg border space-y-3">
            <h3 className="text-center font-semibold text-gray-900">
              สแกน QR เพื่อโอนชำระเงิน
            </h3>
            <div className="relative w-full max-w-sm mx-auto aspect-square bg-white p-4 border-4 border-blue-500 rounded-2xl">
              <Image
                src={order.qr_url}
                alt="QR Code"
                fill
                className="object-contain p-2"
              />
            </div>
            <div className="text-center space-y-1">
              <p className="text-sm text-gray-600">
                ชื่อ: <span className="font-medium">นาย ชวลิวุยี พรสีภาค</span>
              </p>
              <p className="text-sm text-gray-600">
                บัญชี: <span className="font-medium">xxx-x-x2786-x</span>
              </p>
              <p className="text-xs text-gray-500 mt-2">
                เลขคำสั่งซื้อ: {order.public_order_id}
              </p>
            </div>
          </div>
        )}

        {/* Total Amount */}
        <div className="bg-white p-6 rounded-lg border">
          <div className="flex items-center justify-between">
            <span className="text-lg font-semibold text-gray-900">รวม</span>
            <span className="text-3xl font-bold text-green-600">
              {order.total_amount.toFixed(2)} บาท
            </span>
          </div>
        </div>

        {/* Upload Slip */}
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <h3 className="font-semibold text-gray-900">แนบสลิปชำระเงิน</h3>
          
          {displaySlip ? (
            <div className="space-y-2">
              <div className="relative w-full aspect-[3/4] max-w-xs mx-auto bg-gray-100 rounded-lg overflow-hidden">
                <Image
                  src={displaySlip}
                  alt="Slip preview"
                  fill
                  className="object-contain"
                />
                {slipPreview && (
                  <button
                    onClick={() => {
                      setSlipFile(null);
                      setSlipPreview("");
                    }}
                    className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                  >
                    <X size={20} />
                  </button>
                )}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowImageViewer(true)}
                  className="flex-1 py-2 text-blue-600 border border-blue-600 rounded-lg hover:bg-blue-50 transition-colors text-sm font-medium"
                >
                  ดูภาพเต็ม
                </button>
                <label className="flex-1 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium text-center cursor-pointer">
                  เปลี่ยนรูป
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="hidden"
                  />
                </label>
              </div>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-[3/4] max-w-xs mx-auto border-2 border-dashed border-gray-300 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload size={40} className="text-gray-400 mb-2" />
              <span className="text-gray-500 text-sm">คลิกเพื่อเลือกรูปสลิป</span>
              <input
                type="file"
                accept="image/*"
                onChange={handleImageChange}
                className="hidden"
              />
            </label>
          )}

          {order.slip_url && (
            <p className="text-xs text-gray-500 text-center">
              📎 มีสลิปเดิมอยู่แล้ว สามารถอัปโหลดใหม่เพื่อแก้ไขได้
            </p>
          )}
        </div>

        {/* Confirm Button */}
        <button
          onClick={handleConfirmPayment}
          disabled={uploading || (!slipFile && !order.slip_url)}
          className="w-full py-4 bg-black text-white rounded-lg font-bold text-lg hover:bg-gray-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {uploading ? "กำลังบันทึก..." : "ยืนยันการชำระเงิน"}
        </button>
      </div>

      {/* Image Viewer */}
      {showImageViewer && displaySlip && (
        <ImageViewer
          imageUrl={displaySlip}
          onClose={() => setShowImageViewer(false)}
        />
      )}
    </div>
  );
}
