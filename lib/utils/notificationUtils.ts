import { SupabaseClient } from "@supabase/supabase-js";

export type NotificationTrigger =
  | "payment_confirmed"
  | "order_received"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "awaiting_admin_review";

/**
 * Create notification for order status change (client-side version)
 */
export async function createOrderNotificationClient(
  supabase: SupabaseClient,
  orderId: number,
  userId: string,
  trigger: NotificationTrigger
) {
  const messages: Record<NotificationTrigger, string> = {
    payment_confirmed: "✅ การชำระเงินของคุณได้รับการยืนยันแล้ว",
    order_received: "📋 ร้านได้รับออร์เดอร์ของคุณแล้ว กำลังเตรียมอาหาร",
    preparing: "👨‍🍳 กำลังทำอาหารของคุณ",
    ready_for_pickup: "🔔 อาหารของคุณพร้อมรับแล้ว!",
    completed: "✨ ขอบคุณที่ใช้บริการ ResCash",
    cancelled: "❌ ออร์เดอร์ของคุณถูกยกเลิก",
    awaiting_admin_review: "⏳ มีสลิปการโอนเงินรอการตรวจสอบ",
  };

  const { error } = await supabase.from("notification").insert({
    user_id: userId,
    order_id: orderId,
    message: messages[trigger],
    is_read: false,
  });

  if (error) {
    console.log("Error creating notification:", error);
  }
}
