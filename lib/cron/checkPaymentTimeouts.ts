import { createClient } from "@/lib/supabase/server";

export async function checkPaymentTimeouts() {
  const supabase = await createClient();

  try {
    // Get all orders with awaiting_payment status
    const { data: orders, error } = await supabase
      .from("order")
      .select("*")
      .eq("order_status", "awaiting_payment");

    if (error) throw error;

    const now = new Date();
    const ordersToCancel: number[] = [];

    // Check each order
    for (const order of orders || []) {
      const appointmentTime = new Date(order.appointment_time);
      const paymentDeadline = new Date(appointmentTime.getTime() - 12 * 60 * 60 * 1000);

      // If deadline passed, mark for cancellation
      if (now > paymentDeadline) {
        ordersToCancel.push(order.order_id);
      }
    }

    // Cancel expired orders
    if (ordersToCancel.length > 0) {
      const { error: updateError } = await supabase
        .from("order")
        .update({
          order_status: "cancelled",
          update_datetime: now.toISOString(),
        })
        .in("order_id", ordersToCancel);

      if (updateError) throw updateError;

      console.log(`Cancelled ${ordersToCancel.length} expired orders`);
    }

    return { success: true, cancelled: ordersToCancel.length };
  } catch (error) {
    console.log("Error checking payment timeouts:", error);
    return { success: false, error };
  }
}
