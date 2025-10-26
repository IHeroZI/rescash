import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Order {
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
  user?: {
    name: string;
    phone: string;
    profile_image_url: string | null;
  };
}

export function useOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase
        .from("order")
        .select(`
          *,
          user:user_id (
            name,
            phone,
            profile_image_url
          )
        `)
        .order("update_datetime", { ascending: false });

      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.log("Error fetching orders:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  return { orders, loading, refetch: fetchOrders };
}
