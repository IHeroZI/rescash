"use client";

import { useState, use } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Phone, User } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { useOrderDetail } from "@/lib/hooks/useOrderDetail";
import { getOrderStatusInfo, getNextStatus, canChangeStatus } from "@/lib/utils/orderUtils";
import { createClient } from "@/lib/supabase/client";
import { createOrderNotificationClient } from "@/lib/utils/notificationUtils";
import Header from "@/components/common/Header";
import StatusTimeline from "@/components/order/StatusTimeline";
import ImageViewer from "@/components/order/ImageViewer";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import toast from "react-hot-toast";

export default function OrderDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const { userData } = useUser();
  const unwrappedParams = use(params);
  const orderId = parseInt(unwrappedParams.id);
  const { order, loading } = useOrderDetail(orderId);
  
  const [showImageViewer, setShowImageViewer] = useState(false);
  const [showConfirmCancel, setShowConfirmCancel] = useState(false);
  const [showConfirmStatus, setShowConfirmStatus] = useState(false);
  const [updating, setUpdating] = useState(false);

  const handleCancelOrder = async () => {
    if (!order) return;
    
    try {
      setUpdating(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("order")
        .update({ 
          order_status: "cancelled",
          update_datetime: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (error) throw error;

      // Create notification for customer
      const user = Array.isArray(order.user) ? order.user[0] : order.user;
      if (user?.user_id) {
        await createOrderNotificationClient(supabase, orderId, user.user_id, "cancelled");
      }

      toast.success("ยกเลิกคำสั่งซื้อสำเร็จ");
      router.push("/order");
    } catch (error) {
      console.log("Error cancelling order:", error);
      toast.error("เกิดข้อผิดพลาดในการยกเลิกคำสั่งซื้อ");
    } finally {
      setUpdating(false);
      setShowConfirmCancel(false);
    }
  };

  const handleChangeStatus = async () => {
    if (!order || !userData) return;

    const nextStatus = getNextStatus(order.order_status);
    if (!nextStatus) return;

    if (!canChangeStatus(order.order_status, nextStatus, userData.role)) {
      toast.error("คุณไม่มีสิทธิ์เปลี่ยนสถานะนี้");
      return;
    }

    try {
      setUpdating(true);
      const supabase = createClient();
      
      const { error } = await supabase
        .from("order")
        .update({
          order_status: nextStatus,
          update_datetime: new Date().toISOString(),
        })
        .eq("order_id", orderId);

      if (error) throw error;

      // Create notification for customer based on new status
      const user = Array.isArray(order.user) ? order.user[0] : order.user;
      if (user?.user_id) {
        const notificationTriggerMap: Record<string, "payment_confirmed" | "order_received" | "preparing" | "ready_for_pickup" | "completed"> = {
          order_recived: "order_received",
          preparing: "preparing",
          ready_for_pickup: "ready_for_pickup",
          completed: "completed",
        };
        
        const trigger = notificationTriggerMap[nextStatus];
        if (trigger) {
          await createOrderNotificationClient(supabase, orderId, user.user_id, trigger);
        }
      }

      toast.success("เปลี่ยนสถานะสำเร็จ");
      window.location.reload();
    } catch (error) {
      console.log("Error changing status:", error);
      toast.error("เกิดข้อผิดพลาดในการเปลี่ยนสถานะ");
    } finally {
      setUpdating(false);
      setShowConfirmStatus(false);
    }
  };

  if (loading || !userData || !order) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  const user = Array.isArray(order.user) ? order.user[0] : order.user;
  const statusInfo = getOrderStatusInfo(order.order_status);
  const nextStatus = getNextStatus(order.order_status);
  const nextStatusInfo = nextStatus ? getOrderStatusInfo(nextStatus) : null;
  const canChange = nextStatus && canChangeStatus(order.order_status, nextStatus, userData.role);

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="รายละเอียดคำสั่งซื้อ" backHref="/order" showNotificationIcon={true} />

      <div className="flex-1 overflow-y-auto scrollbar-hide p-4 space-y-4 pb-6">
        {/* Status Timeline */}
        <StatusTimeline currentStatus={order.order_status} />

        {/* Order Info */}
        <div className="bg-white p-4 rounded-lg border space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-lg">ORDER : {order.public_order_id}</h3>
            <span className={`px-3 py-1 rounded-full text-xs font-semibold ${statusInfo.color}`}>
              {statusInfo.label}
            </span>
          </div>
          
          <div className="text-sm text-gray-600">
            <p>วันที่สั่ง: {new Date(order.create_datetime).toLocaleString("th-TH")}</p>
            <p>อัปเดตล่าสุด: {new Date(order.update_datetime).toLocaleString("th-TH")}</p>
            <p className="font-semibold text-orange-600 mt-2">
              วันจัดส่ง: {new Date(order.appointment_time).toLocaleString("th-TH", {
                dateStyle: "full",
                timeStyle: "short",
              })}
            </p>
          </div>
        </div>

        {/* Customer Info */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-3">ผู้สั่งซื้อ:</h3>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
              {user?.profile_image_url ? (
                <Image src={user.profile_image_url} alt={user.name} width={48} height={48} className="object-cover" />
              ) : (
                <User size={24} className="text-gray-500" />
              )}
            </div>
            <div className="flex-1">
              <p className="font-medium text-gray-900">{user?.name || "ไม่ระบุชื่อ"}</p>
              <p className="text-sm text-gray-600 flex items-center gap-1">
                <Phone size={14} />
                {user?.phone || "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Menu Items */}
        <div className="bg-white p-4 rounded-lg border">
          <h3 className="font-semibold text-gray-900 mb-3">รายการอาหาร:</h3>
          <div className="space-y-3">
            {order.menuOrders.map((item) => {
              const menu = Array.isArray(item.menu) ? item.menu[0] : item.menu;
              return (
                <div key={`${item.menu_id}-${item.order_id}`} className="flex gap-3">
                  <div className="w-16 h-16 bg-gray-200 rounded-lg overflow-hidden flex-shrink-0">
                    {menu?.menu_image_url && (
                      <Image
                        src={menu.menu_image_url}
                        alt={menu.menu_name}
                        width={64}
                        height={64}
                        className="object-cover w-full h-full"
                      />
                    )}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-gray-900">{menu?.menu_name}</p>
                    <p className="text-sm text-gray-600">ราคา: ฿{menu?.price}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-gray-600">x{item.quantity}</p>
                    <p className="font-semibold text-gray-900">฿{(item.price_at_order_time * item.quantity).toFixed(2)}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Note */}
        {order.notes && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">โน้ตพิเศษ:</h3>
            <p className="text-gray-700 text-sm whitespace-pre-wrap">{order.notes}</p>
          </div>
        )}

        {/* Slip Image */}
        {order.slip_url && (
          <div className="bg-white p-4 rounded-lg border">
            <h3 className="font-semibold text-gray-900 mb-2">หลักฐานการโอนเงิน:</h3>
            <div className="flex gap-2">
              <button
                onClick={() => setShowImageViewer(true)}
                className="flex-1 text-gray-800 hover:underline text-sm font-medium"
              >
                📎 คลิกเพื่อดูสลิป
              </button>
              {userData.role === "customer" && order.order_status === "awaiting_admin_review" && (
                <button
                  onClick={() => router.push(`/order/${orderId}/payment`)}
                  className="px-4 py-2 bg-gray-800 text-white rounded-lg text-sm hover:bg-gray-700 transition-colors"
                >
                  แก้ไขสลิป
                </button>
              )}
            </div>
          </div>
        )}

        {/* Total */}
        <div className="bg-white p-4 rounded-lg border">
          <div className="flex items-center justify-between text-xl font-bold">
            <span>รวมทั้งหมด</span>
            <span className="text-green-600">฿{order.total_amount.toFixed(2)}</span>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2">
          {/* Customer: Payment and Cancel buttons */}
          {userData.role === "customer" && order.order_status === "awaiting_payment" && (
            <>
              <button
                onClick={() => router.push(`/order/${orderId}/payment`)}
                className="w-full py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
              >
                ชำระเงิน
              </button>
              <button
                onClick={() => setShowConfirmCancel(true)}
                disabled={updating}
                className="w-full py-3 bg-red-600 text-white rounded-lg font-semibold hover:bg-red-700 transition-colors disabled:opacity-50"
              >
                ยกเลิกคำสั่งซื้อ
              </button>
            </>
          )}

          {/* Staff/Admin: Change status button */}
          {(userData.role === "staff" || userData.role === "admin") && 
           order.order_status !== "completed" && 
           order.order_status !== "cancelled" && 
           canChange && (
            <button
              onClick={() => setShowConfirmStatus(true)}
              disabled={updating}
              className="w-full py-3 bg-gray-800 text-white rounded-lg font-semibold hover:bg-gray-700 transition-colors disabled:opacity-50"
            >
              เปลี่ยนสถานะ: {statusInfo.label} → {nextStatusInfo?.label}
            </button>
          )}
        </div>
      </div>

      {/* Image Viewer */}
      {showImageViewer && order.slip_url && (
        <ImageViewer
          imageUrl={order.slip_url}
          onClose={() => setShowImageViewer(false)}
        />
      )}

      {/* Confirm Cancel Dialog */}
      <ConfirmDialog
        isOpen={showConfirmCancel}
        onClose={() => setShowConfirmCancel(false)}
        onConfirm={handleCancelOrder}
        title="ยืนยันการยกเลิก"
        message="คุณต้องการยกเลิกคำสั่งซื้อนี้ใช่หรือไม่?"
        confirmText="ยืนยัน"
        confirmColor="bg-red-600 hover:bg-red-700"
      />

      {/* Confirm Status Change Dialog */}
      <ConfirmDialog
        isOpen={showConfirmStatus}
        onClose={() => setShowConfirmStatus(false)}
        onConfirm={handleChangeStatus}
        title="ยืนยันการเปลี่ยนสถานะ"
        message={`คุณต้องการเปลี่ยนสถานะจาก "${statusInfo.label}" เป็น "${nextStatusInfo?.label}" ใช่หรือไม่?`}
        confirmText="ยืนยัน"
        confirmColor="bg-gray-800 hover:bg-gray-700"
      />
    </div>
  );
}
