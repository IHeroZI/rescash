import { createClient } from "@/lib/supabase/client";
import { generatePublicOrderId } from "./orderUtils";
import { generatePromptPayQR } from "./qrCodeGenerator";

export interface CartItem {
  menu_id: number;
  quantity: number;
  price: number;
}

export interface CreateOrderData {
  user_id: number;
  cart_items: CartItem[];
  total_amount: number;
  appointment_time: string;
  notes?: string;
}

export async function createOrder(data: CreateOrderData): Promise<number> {
  const supabase = createClient();

  try {
    // ดึงเบอร์ PromptPay จาก environment variable
    const promptpayMobile = process.env.NEXT_PUBLIC_PROMPTPAY_MOBILE;
    
    if (!promptpayMobile) {
      throw new Error("NEXT_PUBLIC_PROMPTPAY_MOBILE is not set in environment variables");
    }

    // Generate public order ID
    const publicOrderId = await generatePublicOrderId(supabase);

    // Generate PromptPay QR Code with correct amount and mobile number
    const qrDataUrl = await generatePromptPayQR(data.total_amount, promptpayMobile);

    // Convert data URL to blob
    const blob = await fetch(qrDataUrl).then((res) => res.blob());
    
    // Upload QR code to storage
    const qrFileName = `qr-${publicOrderId}.png`;
    const qrFilePath = `qr-codes/${qrFileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(qrFilePath, blob, {
        contentType: "image/png",
      });

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl: qrUrl },
    } = supabase.storage.from("images").getPublicUrl(qrFilePath);

    // Create order
    const { data: orderData, error: orderError } = await supabase
      .from("order")
      .insert({
        user_id: data.user_id,
        total_amount: data.total_amount,
        order_status: "awaiting_payment",
        public_order_id: publicOrderId,
        appointment_time: data.appointment_time,
        notes: data.notes || null,
        qr_url: qrUrl,
        create_datetime: new Date().toISOString(),
        update_datetime: new Date().toISOString(),
      })
      .select()
      .single();

    if (orderError) throw orderError;

    // Create menu orders
    const menuOrders = data.cart_items.map((item) => ({
      order_id: orderData.order_id,
      menu_id: item.menu_id,
      quantity: item.quantity,
      price_at_order_time: item.price,
    }));

    const { error: menuOrdersError } = await supabase
      .from("menuOrder")
      .insert(menuOrders);

    if (menuOrdersError) throw menuOrdersError;

    return orderData.order_id;
  } catch (error) {
    console.log("Error creating order:", error);
    throw error;
  }
}
