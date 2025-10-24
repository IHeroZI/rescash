"use client";

import { useEffect, useState } from "react";
import { Bell, Search, Plus } from "lucide-react";
import { useUser } from "@/lib/hooks/useUser";
import { createClient } from "@/lib/supabase/client";
import NavBar from "@/components/common/NavBar";

interface Order {
  order_id: number;
  total_amount: number;
  order_status: string;
  create_datetime: string;
  public_order_id: string | null;
}

export default function OrderPage() {
  const { userData } = useUser();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchOrders = async () => {
      if (!userData) return;

      try {
        const supabase = createClient();
        
        let query = supabase
          .from("Order")
          .select("*")
          .order("create_datetime", { ascending: false });

        // Customer sees only their orders
        if (userData.role === "customer") {
          query = query.eq("user_id", userData.user_id);
        }

        const { data, error } = await query;

        if (error) throw error;
        setOrders(data || []);
      } catch (error) {
        console.log("Error fetching orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();
  }, [userData]);

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  const role = userData.role;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          <h1 className="text-2xl font-bold">
            {role === "admin" ? "จัดการเมนู" : role === "staff" ? "จัดการเมนู" : "ตะกร้า"}
          </h1>
          <Bell size={24} />
        </div>

        {/* Search */}
        <div className="relative">
          <Search size={20} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="ค้นหาเมนูอาหาร"
            className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          />
        </div>

        {(role === "admin" || role === "staff") && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">จำนวนเมนู : {orders.length}</span>
            <button className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2">
              <Plus size={20} />
              <span>เพิ่มเมนู</span>
            </button>
          </div>
        )}
      </div>

      {/* Orders List */}
      <div className="p-4 space-y-3">
        {orders.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            ไม่มีคำสั่งซื้อ
          </div>
        ) : (
          orders.map((order) => (
            <div
              key={order.order_id}
              className="p-4 bg-white border border-gray-200 rounded-lg"
            >
              <div className="flex justify-between items-start mb-2">
                <div>
                  <p className="font-semibold text-gray-900">
                    Order #{order.public_order_id || order.order_id}
                  </p>
                  <p className="text-sm text-gray-600">{order.order_status}</p>
                </div>
                <p className="font-bold text-green-600">
                  ฿{order.total_amount?.toFixed(2) || "0.00"}
                </p>
              </div>
              <p className="text-xs text-gray-500">
                {new Date(order.create_datetime).toLocaleString("th-TH")}
              </p>
            </div>
          ))
        )}
      </div>

      <NavBar />
    </div>
  );
}
