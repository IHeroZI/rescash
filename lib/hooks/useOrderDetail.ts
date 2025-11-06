import { useEffect, useState } from "react";

export interface MenuOrder {
  menu_id: number;
  menu_name: string;
  quantity: number;
  price_at_order_time: number;
  menu_image_url: string | null;
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
  user?: {
    name: string;
    phone: string;
    email: string;
    profile_image_url: string | null;
  };
  items: MenuOrder[];
}

export function useOrderDetail(orderId: number | null) {
  const [order, setOrder] = useState<OrderDetail | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    if (!orderId) {
      setLoading(false);
      return;
    }
    
    try {
      setLoading(true);
      const response = await fetch(`/api/orders/${orderId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch order');
      }

      setOrder(result.data);
    } catch (error) {
      console.log("Error fetching order detail:", error);
      setOrder(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrder();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId]);

  return { order, loading, refetch: fetchOrder };
}
