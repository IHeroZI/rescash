import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface MenuOrder {
  menu_id: number;
  order_id: number;
  quantity: number;
  price_at_order_time: number;
  menu: {
    menu_name: string;
    price: number;
    menu_image_url: string;
  };
}

export interface OrderDetail {
  order_id: number;
  user_id: number;
  total_amount: number;
  order_status: string;
  create_datetime: string;
  update_datetime: string;
  public_order_id: string;
  appointment_time: string;
  notes: string | null;
  qr_url: string | null;
  slip_url: string | null;
  user: {
    user_id: string; // UUID from auth
    name: string;
    phone: string;
    profile_image_url: string | null;
  };
  menuOrders: MenuOrder[];
}

export function useOrderDetail(orderId: number | null) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!orderId) return;
    
    const fetchOrder = async () => {
      try {
        const supabase = createClient();
        const { data, error } = await supabase
          .from("order")
          .select(`
            *,
            user:user_id (
              user_id,
              name,
              phone,
              profile_image_url
            )
          `)
          .eq("order_id", orderId)
          .single();

        if (error) throw error;

        // Fetch menu orders
        const { data: menuOrdersData, error: menuOrdersError } = await supabase
          .from("menuOrder")
          .select(`
            *,
            menu:menu_id (
              menu_name,
              price,
              menu_image_url
            )
          `)
          .eq("order_id", orderId);

        if (menuOrdersError) throw menuOrdersError;

        setOrder({
          ...data,
          menuOrders: menuOrdersData || [],
        });
      } catch (error) {
        console.log("Error fetching order detail:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrder();
  }, [orderId]);

  return { order, loading, refetch: () => {
    if (orderId) {
      setLoading(true);
      // Trigger re-fetch by changing state
    }
  } };
}
