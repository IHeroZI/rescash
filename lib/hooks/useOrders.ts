import { useEffect, useState } from "react";

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
      const response = await fetch('/api/orders');
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch orders');
      }

      setOrders(result.data || []);
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
