"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/lib/hooks/useUser";
import { useOrders } from "@/lib/hooks/useOrders";
import Header from "@/components/common/Header";
import SearchBar from "@/components/common/SearchBar";
import OrderCard from "@/components/order/OrderCard";
import NavBar from "@/components/common/NavBar";

const filterOptions = [
  { value: "all", label: "ทั้งหมด" },
  { value: "awaiting_payment", label: "รอชำระเงิน" },
  { value: "awaiting_admin_review", label: "รอตรวจสอบสลิป" },
  { value: "order_recived", label: "รับออร์เดอร์แล้ว" },
  { value: "preparing", label: "กำลังเตรียมอาหาร" },
  { value: "ready_for_pickup", label: "อาหารพร้อมรับ" },
  { value: "completed", label: "เสร็จสมบูรณ์" },
  { value: "cancelled", label: "ยกเลิก" },
];

export default function OrderPage() {
  const router = useRouter();
  const { userData } = useUser();
  const { orders, loading } = useOrders();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");

  if (loading || !userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  // Filter orders by user role
  let filteredOrders = orders;
  if (userData.role === "customer") {
    filteredOrders = orders.filter((order) => order.user_id === userData.user_id);
  }

  // Apply search filter
  if (searchQuery) {
    filteredOrders = filteredOrders.filter((order) => {
      const user = Array.isArray(order.user) ? order.user[0] : order.user;
      const userName = user?.name?.toLowerCase() || "";
      const publicOrderId = order.public_order_id.toLowerCase();
      const query = searchQuery.toLowerCase();
      
      return publicOrderId.includes(query) || userName.includes(query);
    });
  }

  // Apply status filter
  if (selectedFilter !== "all") {
    filteredOrders = filteredOrders.filter(
      (order) => order.order_status === selectedFilter
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="คำสั่งซื้อ" showBackButton = {false} showNotificationIcon={true} />

      <div className="px-4 space-y-4">
        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาคำสั่งซื้อ"
        />

        {/* Filter buttons */}
        <div className="flex gap-1.5 overflow-x-auto scrollbar-hide">
          {filterOptions.map((option) => {
            const isActive = selectedFilter === option.value;
            
            // Define active styles based on status
            let activeClass = "";
            if (isActive) {
              if (option.value === "all") {
                activeClass = "border-2 border-gray-800 text-gray-800";
              } else if (option.value === "awaiting_payment") {
                activeClass = "border-2 border-yellow-400 text-yellow-700";
              } else if (option.value === "awaiting_admin_review") {
                activeClass = "border-2 border-orange-400 text-orange-700";
              } else if (option.value === "order_recived") {
                activeClass = "border-2 border-blue-400 text-blue-700";
              } else if (option.value === "preparing") {
                activeClass = "border-2 border-purple-400 text-purple-700";
              } else if (option.value === "ready_for_pickup") {
                activeClass = "border-2 border-green-400 text-green-700";
              } else if (option.value === "completed") {
                activeClass = "border-2 border-gray-400 text-gray-700";
              } else if (option.value === "cancelled") {
                activeClass = "border-2 border-red-400 text-red-700";
              }
            }
            
            return (
              <button
                key={option.value}
                onClick={() => setSelectedFilter(option.value)}
                className={`px-3 py-1 rounded-full text-sm font-medium whitespace-nowrap transition-all bg-white ${
                  isActive
                    ? activeClass
                    : "text-gray-600 border-2 border-gray-200 hover:border-gray-300"
                }`}
              >
                {option.label}
              </button>
            );
          })}
        </div>

        {/* Orders count */}
        <div className="flex px-2 items-center justify-between">
          <p className="text-sm text-gray-600">
            พบ {filteredOrders.length} รายการ
          </p>
        </div>
      </div>
        
      {/* Orders List - Scrollable */}
      <div className="flex-1 overflow-y-auto scrollbar-hide px-6 pb-20">
        <div className="space-y-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              ไม่มีคำสั่งซื้อ
            </div>
          ) : (
            filteredOrders.map((order) => (
              <OrderCard
                key={order.order_id}
                order={order}
                onClick={() => router.push(`/order/${order.order_id}`)}
              />
            ))
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
