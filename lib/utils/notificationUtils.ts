import { SupabaseClient } from "@supabase/supabase-js";

/**
 * ระบบแจ้งเตือนสำหรับ ResCash
 * รองรับการแจ้งเตือนตาม order status และ user role
 */

// Order status types ตาม database
export type OrderStatus =
  | "awaiting_payment"
  | "awaiting_admin_review"
  | "order_recived"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "payment_timeout";

// User roles ตาม database
export type UserRole = "customer" | "staff" | "admin";

interface OrderInfo {
  order_id: number;
  public_order_id: string;
  user_id: number;
  customer_name: string;
  customer_phone?: string;
  order_status: OrderStatus;
  total_amount: number;
  appointment_time: string;
  create_datetime: string;
}

/**
 * ดึงข้อมูล Order พร้อมข้อมูลลูกค้า
 */
async function getOrderInfo(
  supabase: SupabaseClient,
  orderId: number
): Promise<OrderInfo | null> {
  const { data, error } = await supabase
    .from("order")
    .select(`
      order_id,
      public_order_id,
      user_id,
      order_status,
      total_amount,
      appointment_time,
      create_datetime,
      users (
        user_id,
        name,
        phone
      )
    `)
    .eq("order_id", orderId)
    .single();

  if (error) {
    console.log("[getOrderInfo] Error fetching order info:", error);
    return null;
  }

  const user = Array.isArray(data.users) ? data.users[0] : data.users;
  
  console.log("[getOrderInfo] Order data:", {
    order_id: data.order_id,
    user_id: data.user_id,
    customer: user?.name
  });

  return {
    order_id: data.order_id,
    public_order_id: data.public_order_id || `#${data.order_id}`,
    user_id: data.user_id,
    customer_name: user?.name || "ลูกค้า",
    customer_phone: user?.phone,
    order_status: data.order_status,
    total_amount: data.total_amount,
    appointment_time: data.appointment_time,
    create_datetime: data.create_datetime,
  };
}

/**
 * สร้าง notification message ตาม status และ role
 */
function generateNotificationMessage(
  orderInfo: OrderInfo,
  status: OrderStatus,
  recipientRole: UserRole
): string {
  const orderNumber = orderInfo.public_order_id;
  const customerName = orderInfo.customer_name;
  const amount = orderInfo.total_amount.toFixed(2);
  const appointmentTime = new Date(orderInfo.appointment_time).toLocaleString("th-TH", {
    dateStyle: "medium",
    timeStyle: "short",
  });

  // Messages สำหรับ Customer
  if (recipientRole === "customer") {
    switch (status) {
      case "awaiting_payment":
        return `⏳ รอชำระเงิน - ออร์เดอร์ ${orderNumber} จำนวน ${amount} บาท กรุณาชำระเงินก่อน 12 ชม. ของเวลารับอาหาร`;
      case "awaiting_admin_review":
        return `🔍 รอตรวจสอบสลิป - ออร์เดอร์ ${orderNumber} ทางเรากำลังตรวจสอบการชำระเงินของคุณ`;
      case "order_recived":
        return `✅ ร้านรับออร์เดอร์แล้ว - ออร์เดอร์ ${orderNumber} ทางร้านกำลังเตรียมอาหารของคุณ`;
      case "preparing":
        return `👨‍🍳 กำลังเตรียมอาหาร - ออร์เดอร์ ${orderNumber} กำลังทำอาหารของคุณ`;
      case "ready_for_pickup":
        return `🔔 อาหารพร้อมรับแล้ว! - ออร์เดอร์ ${orderNumber} สามารถมารับได้ที่ร้าน เวลา ${appointmentTime}`;
      case "completed":
        return `✨ คำสั่งซื้อเสร็จสมบูรณ์ - ออร์เดอร์ ${orderNumber} ขอบคุณที่ใช้บริการ ResCash`;
      case "cancelled":
        return `❌ ออร์เดอร์ถูกยกเลิก - ออร์เดอร์ ${orderNumber} ถูกยกเลิกแล้ว`;
      case "payment_timeout":
        return `⏰ ออร์เดอร์หมดเวลา - ออร์เดอร์ ${orderNumber} หมดเวลาชำระเงินแล้ว`;
      default:
        return `📢 อัพเดทออร์เดอร์ ${orderNumber}`;
    }
  }

  // Messages สำหรับ Staff
  if (recipientRole === "staff") {
    switch (status) {
      case "order_recived":
        return `📋 ออร์เดอร์ใหม่! - ${orderNumber} ลูกค้า: ${customerName} รับเวลา: ${appointmentTime}`;
      case "preparing":
        return `👨‍🍳 เริ่มเตรียมอาหาร - ${orderNumber} ลูกค้า: ${customerName}`;
      case "ready_for_pickup":
        return `✅ อาหารพร้อมส่ง - ${orderNumber} ลูกค้า: ${customerName} โทร: ${orderInfo.customer_phone || "-"}`;
      case "completed":
        return `✨ ส่งมอบสำเร็จ - ${orderNumber} ลูกค้า: ${customerName}`;
      case "cancelled":
        return `❌ ยกเลิกออร์เดอร์ - ${orderNumber} ลูกค้า: ${customerName}`;
      default:
        return `📢 อัพเดทออร์เดอร์ ${orderNumber} - ลูกค้า: ${customerName}`;
    }
  }

  // Messages สำหรับ Admin
  if (recipientRole === "admin") {
    switch (status) {
      case "awaiting_admin_review":
        return `💰 สลิปใหม่รอตรวจสอบ - ${orderNumber} ลูกค้า: ${customerName} จำนวน: ${amount} บาท`;
      case "order_recived":
        return `✅ ยืนยันสลิปแล้ว - ${orderNumber} ลูกค้า: ${customerName}`;
      case "cancelled":
        return `❌ ยกเลิกออร์เดอร์ - ${orderNumber} ลูกค้า: ${customerName} จำนวน: ${amount} บาท`;
      case "payment_timeout":
        return `⏰ ออร์เดอร์หมดเวลา - ${orderNumber} ลูกค้า: ${customerName}`;
      default:
        return `📢 อัพเดทออร์เดอร์ ${orderNumber} - ลูกค้า: ${customerName}`;
    }
  }

  return `📢 อัพเดทออร์เดอร์ ${orderNumber}`;
}

interface NotificationResult {
  success: boolean;
  data?: unknown;
  error?: unknown;
}

/**
 * สร้าง notification ให้ user คนเดียว
 */
async function createNotification(
  supabase: SupabaseClient,
  userId: number,
  orderId: number,
  message: string
): Promise<NotificationResult> {
  console.log(`[createNotification] Creating for user ${userId}, order ${orderId}`);
  console.log(`[createNotification] Message:`, message);

  const { data, error } = await supabase
    .from("notification")
    .insert({
      user_id: userId,
      order_id: orderId,
      message: message,
      is_read: false,
    })
    .select()
    .single();

  if (error) {
    console.log(`[createNotification] ❌ Error for user ${userId}:`, error);
    console.log(`[createNotification] Error details:`, JSON.stringify(error, null, 2));
    return { success: false, error };
  }

  console.log(`[createNotification] ✅ Success for user ${userId}:`, data);
  return { success: true, data };
}

/**
 * ดึง users ตาม role
 */
async function getUsersByRole(
  supabase: SupabaseClient,
  role: UserRole
): Promise<{ user_id: number }[]> {
  console.log(`[getUsersByRole] Fetching users with role: ${role}`);
  
  const { data, error } = await supabase
    .from("users")
    .select("user_id, name, email, role")
    .eq("role", role);

  if (error) {
    console.log(`[getUsersByRole] ❌ Error fetching ${role} users:`, error);
    return [];
  }

  console.log(`[getUsersByRole] ✅ Found ${data?.length || 0} ${role}(s):`, data);
  
  // แสดง user_id แต่ละคนชัดเจน
  if (data && data.length > 0) {
    console.log(`[getUsersByRole] ${role} user_ids:`, data.map(u => u.user_id));
  }
  
  return data || [];
}

/**
 * ============================================================================
 * MAIN NOTIFICATION FUNCTIONS
 * ============================================================================
 */

interface NotificationBatchResult {
  role: UserRole | "customer";
  userId: number;
  success: boolean;
  data?: unknown;
  error?: unknown;
}

/**
 * แจ้งเตือนเมื่อ Order เปลี่ยนสถานะ
 * จะแจ้งเตือนไปยัง user ที่เกี่ยวข้องตาม role โดยอัตโนมัติ
 */
export async function notifyOrderStatusChange(
  supabase: SupabaseClient,
  orderId: number,
  newStatus: OrderStatus
): Promise<{ success: boolean; results: NotificationBatchResult[] }> {
  console.log(`[Notification] Order ${orderId} status changed to: ${newStatus}`);

  // ดึงข้อมูล order
  const orderInfo = await getOrderInfo(supabase, orderId);
  if (!orderInfo) {
    console.log(`[Notification] Cannot get order info for order ${orderId}`);
    return { success: false, results: [] };
  }

  const results: NotificationBatchResult[] = [];

  // กำหนดว่าใครควรได้รับ notification ตาม status
  switch (newStatus) {
    case "awaiting_payment":
      // แจ้งลูกค้าที่สร้าง order
      {
        const message = generateNotificationMessage(orderInfo, newStatus, "customer");
        const result = await createNotification(supabase, orderInfo.user_id, orderId, message);
        results.push({ role: "customer", userId: orderInfo.user_id, ...result });
      }
      break;

    case "awaiting_admin_review":
      // แจ้งลูกค้าว่าส่งสลิปแล้ว
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง admins ทุกคนให้ตรวจสอบสลิป
      {
        const admins = await getUsersByRole(supabase, "admin");
        console.log(`[Notification] Notifying ${admins.length} admin(s) about new slip`);

        for (const admin of admins) {
          const message = generateNotificationMessage(orderInfo, newStatus, "admin");
          const result = await createNotification(supabase, admin.user_id, orderId, message);
          results.push({ role: "admin", userId: admin.user_id, ...result });
        }
      }
      break;

    case "order_recived":
      // แจ้งลูกค้าว่าร้านรับออร์เดอร์แล้ว
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง staff ทุกคนให้เตรียมอาหาร
      {
        const staffs = await getUsersByRole(supabase, "staff");
        console.log(`[Notification] Notifying ${staffs.length} staff member(s) about new order`);

        for (const staff of staffs) {
          const message = generateNotificationMessage(orderInfo, newStatus, "staff");
          const result = await createNotification(supabase, staff.user_id, orderId, message);
          results.push({ role: "staff", userId: staff.user_id, ...result });
        }
      }

      // แจ้ง admins ด้วย (เพื่อให้ติดตาม)
      {
        const admins = await getUsersByRole(supabase, "admin");
        for (const admin of admins) {
          const message = generateNotificationMessage(orderInfo, newStatus, "admin");
          const result = await createNotification(supabase, admin.user_id, orderId, message);
          results.push({ role: "admin", userId: admin.user_id, ...result });
        }
      }
      break;

    case "preparing":
      // แจ้งลูกค้าว่ากำลังทำอาหาร
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง staff (เพื่อให้รู้ว่า order ไหนกำลังทำ)
      {
        const staffs = await getUsersByRole(supabase, "staff");
        for (const staff of staffs) {
          const message = generateNotificationMessage(orderInfo, newStatus, "staff");
          const result = await createNotification(supabase, staff.user_id, orderId, message);
          results.push({ role: "staff", userId: staff.user_id, ...result });
        }
      }
      break;

    case "ready_for_pickup":
      // แจ้งลูกค้าว่าอาหารพร้อมรับ (สำคัญมาก!)
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง staff ว่าอาหารพร้อมส่งมอบ
      {
        const staffs = await getUsersByRole(supabase, "staff");
        for (const staff of staffs) {
          const message = generateNotificationMessage(orderInfo, newStatus, "staff");
          const result = await createNotification(supabase, staff.user_id, orderId, message);
          results.push({ role: "staff", userId: staff.user_id, ...result });
        }
      }
      break;

    case "completed":
      // แจ้งลูกค้าขอบคุณ
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง staff ว่าส่งมอบสำเร็จ
      {
        const staffs = await getUsersByRole(supabase, "staff");
        for (const staff of staffs) {
          const message = generateNotificationMessage(orderInfo, newStatus, "staff");
          const result = await createNotification(supabase, staff.user_id, orderId, message);
          results.push({ role: "staff", userId: staff.user_id, ...result });
        }
      }
      break;

    case "cancelled":
      // แจ้งลูกค้าว่าออร์เดอร์ถูกยกเลิก
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง staff และ admin
      {
        const staffs = await getUsersByRole(supabase, "staff");
        const admins = await getUsersByRole(supabase, "admin");

        for (const staff of staffs) {
          const message = generateNotificationMessage(orderInfo, newStatus, "staff");
          const result = await createNotification(supabase, staff.user_id, orderId, message);
          results.push({ role: "staff", userId: staff.user_id, ...result });
        }

        for (const admin of admins) {
          const message = generateNotificationMessage(orderInfo, newStatus, "admin");
          const result = await createNotification(supabase, admin.user_id, orderId, message);
          results.push({ role: "admin", userId: admin.user_id, ...result });
        }
      }
      break;

    case "payment_timeout":
      // แจ้งลูกค้าว่าหมดเวลาชำระเงิน
      {
        const customerMessage = generateNotificationMessage(orderInfo, newStatus, "customer");
        const customerResult = await createNotification(
          supabase,
          orderInfo.user_id,
          orderId,
          customerMessage
        );
        results.push({ role: "customer", userId: orderInfo.user_id, ...customerResult });
      }

      // แจ้ง admin ด้วย
      {
        const admins = await getUsersByRole(supabase, "admin");
        for (const admin of admins) {
          const message = generateNotificationMessage(orderInfo, newStatus, "admin");
          const result = await createNotification(supabase, admin.user_id, orderId, message);
          results.push({ role: "admin", userId: admin.user_id, ...result });
        }
      }
      break;

    default:
      console.log(`[Notification] Unknown status: ${newStatus}`);
      break;
  }

  const successCount = results.filter((r) => r.success).length;
  console.log(
    `[Notification] Sent ${successCount}/${results.length} notifications for order ${orderId}`
  );

  return { success: successCount > 0, results };
}

/**
 * ============================================================================
 * BACKWARD COMPATIBILITY FUNCTIONS (เพื่อไม่ให้ code เดิมพัง)
 * ============================================================================
 */

export type NotificationTrigger =
  | "payment_confirmed"
  | "order_received"
  | "preparing"
  | "ready_for_pickup"
  | "completed"
  | "cancelled"
  | "awaiting_admin_review"
  | "new_slip_uploaded";

/**
 * @deprecated ใช้ notifyOrderStatusChange แทน
 */
export async function createOrderNotificationClient(
  supabase: SupabaseClient,
  orderId: number,
  userId: number,
  trigger: NotificationTrigger
) {
  const statusMap: Record<NotificationTrigger, OrderStatus> = {
    payment_confirmed: "awaiting_payment",
    order_received: "order_recived",
    preparing: "preparing",
    ready_for_pickup: "ready_for_pickup",
    completed: "completed",
    cancelled: "cancelled",
    awaiting_admin_review: "awaiting_admin_review",
    new_slip_uploaded: "awaiting_admin_review",
  };

  const status = statusMap[trigger];
  return notifyOrderStatusChange(supabase, orderId, status);
}

/**
 * @deprecated ใช้ notifyOrderStatusChange(supabase, orderId, "awaiting_admin_review") แทน
 */
export async function notifyAdminsNewSlip(supabase: SupabaseClient, orderId: number) {
  return notifyOrderStatusChange(supabase, orderId, "awaiting_admin_review");
}

/**
 * @deprecated ใช้ notifyOrderStatusChange(supabase, orderId, "order_recived") แทน
 */
export async function notifyStaffOrderReceived(supabase: SupabaseClient, orderId: number) {
  return notifyOrderStatusChange(supabase, orderId, "order_recived");
}
