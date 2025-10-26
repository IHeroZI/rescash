"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, Minus, Plus, Trash2, Calendar } from "lucide-react";
import Image from "next/image";
import DatePicker, { registerLocale } from "react-datepicker";
import { th } from "date-fns/locale";
import "react-datepicker/dist/react-datepicker.css";
import "./datepicker.css";
import { useCartStore } from "@/lib/store/cartStore";
import { useUser } from "@/lib/hooks/useUser";
import { createOrder } from "@/lib/utils/createOrder";
import toast from "react-hot-toast";
import Header from "@/components/common/Header";

// ลงทะเบียน locale ภาษาไทย
registerLocale("th", th);

export default function CartPage() {
  const router = useRouter();
  const { userData } = useUser();

  const { items, updateQuantity, removeItem, clearCart, getTotalPrice } = useCartStore();
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // เพิ่ม state สำหรับวันและเวลารับอาหาร (เป็น Date object)
  const [pickupDateTime, setPickupDateTime] = useState<Date>(() => {
    const now = new Date();
    // ตั้งเวลาเริ่มต้นเป็น 12 ชั่วโมงข้างหน้า
    now.setHours(now.getHours() + 12);
    return now;
  });

  const totalPrice = getTotalPrice();

  const handleCreateOrder = async () => {
    if (items.length === 0) {
      toast.error("กรุณาเลือกเมนูอาหาร");
      return;
    }

    if (!userData) {
      toast.error("กรุณาเข้าสู่ระบบ");
      return;
    }

    // Validate: ต้องเป็นเวลาในอนาคตอย่างน้อย 12 ชั่วโมง
    const now = new Date();
    const minTime = new Date(now.getTime() + 12 * 60 * 60 * 1000); // +12 ชั่วโมง
    
    if (pickupDateTime < minTime) {
      toast.error("กรุณาเลือกเวลารับอาหารอย่างน้อย 12 ชั่วโมงข้างหน้า");
      return;
    }

    setIsSubmitting(true);

    try {
      // แปลง Date เป็น timestamp (ISO string)
      const pickupTimestamp = pickupDateTime.toISOString();

      // Create order with QR code and public_order_id
      const orderId = await createOrder({
        user_id: userData.user_id,
        cart_items: items.map((item) => ({
          menu_id: item.menu_id,
          quantity: item.quantity,
          price: item.price,
        })),
        total_amount: totalPrice,
        appointment_time: pickupTimestamp,
        notes: notes || undefined,
      });

      toast.success("สั่งอาหารสำเร็จ!");
      clearCart();
      router.push(`/order/${orderId}`);
    } catch (error) {
      console.log("Error creating order:", error);
      toast.error("เกิดข้อผิดพลาดในการสั่งอาหาร");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="min-h-screen bg-white">
        <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => router.back()}>
            <ChevronLeft size={24} />
          </button>
          <h1 className="text-xl font-bold">ตะกร้า</h1>
        </div>
        <div className="flex flex-col items-center justify-center h-96">
          <p className="text-gray-400 text-lg mb-4">ตะกร้าว่างเปล่า</p>
          <button
            onClick={() => router.push("/menu")}
            className="px-6 py-2 bg-black text-white rounded-full"
          >
            เลือกเมนูอาหาร
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white pb-32">
      {/* Header */}
      <Header title="ตะกร้า" backHref="/menu" />
      
      {/* Order Info: เลือกวันและเวลารับอาหาร */}
      <div className="p-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          <Calendar className="inline mr-2" size={16} />
          วันและเวลารับอาหาร
        </label>
        <div className="relative">
          <DatePicker
            selected={pickupDateTime}
            onChange={(date) => date && setPickupDateTime(date)}
            showTimeSelect
            timeIntervals={15}
            dateFormat="dd/MM/yyyy HH:mm น."
            minDate={new Date()}
            minTime={(() => {
              const now = new Date();
              const minDateTime = new Date(now.getTime() + 12 * 60 * 60 * 1000);
              
              // ถ้าเลือกวันที่เป็นวันนี้ ให้เริ่มต้นจากเวลาขั้นต่ำ (+12 ชม.)
              if (pickupDateTime.toDateString() === now.toDateString()) {
                return minDateTime;
              }
              // ถ้าเป็นวันอื่น ให้เริ่มต้นจาก 00:00
              const startOfDay = new Date(pickupDateTime);
              startOfDay.setHours(0, 0, 0, 0);
              return startOfDay;
            })()}
            maxTime={(() => {
              const endOfDay = new Date(pickupDateTime);
              endOfDay.setHours(23, 59, 59, 999);
              return endOfDay;
            })()}
            locale="th"
            className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 text-base"
            placeholderText="เลือกวันและเวลา"
            timeCaption="เวลา"
            withPortal
            portalId="root-portal"
          />
        </div>
        <p className="text-xs text-gray-500 mt-2">
          * กรุณาเลือกเวลารับอาหารอย่างน้อย 12 ชั่วโมงข้างหน้า
        </p>
      </div>

      {/* Cart Items */}
      <div className="p-4 space-y-3">
        {items.map((item) => (
          <div key={item.menu_id} className="flex items-center gap-3 bg-white border border-gray-200 rounded-lg p-3">
            <div className="relative w-16 h-16 flex-shrink-0">
              {item.menu_image_url ? (
                <Image
                  src={item.menu_image_url}
                  alt={item.menu_name}
                  width={64}
                  height={64}
                  className="w-full h-full rounded-lg object-cover"
                />
              ) : (
                <div className="w-full h-full rounded-lg bg-gray-200" />
              )}
            </div>

            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">{item.menu_name}</h3>
              <div className="flex items-center gap-2 mt-1">
                <button
                  onClick={() => updateQuantity(item.menu_id, item.quantity - 1)}
                  className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center"
                >
                  <Minus size={14} className="text-white" />
                </button>
                <span className="font-semibold w-6 text-center">{item.quantity}</span>
                <button
                  onClick={() => updateQuantity(item.menu_id, item.quantity + 1)}
                  className="w-6 h-6 bg-green-500 rounded-full flex items-center justify-center"
                >
                  <Plus size={14} className="text-white" />
                </button>
              </div>
            </div>

            <div className="text-right">
              <p className="font-bold text-gray-900">{item.price * item.quantity}.00</p>
              <button
                onClick={() => removeItem(item.menu_id)}
                className="mt-1 text-red-500 hover:text-red-700"
              >
                <Trash2 size={16} />
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Notes */}
      <div className="px-4 mb-4">
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          โน้ตเพิ่มเติม (ถ้ามี)
        </label>
        <textarea
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="เช่น ไม่ใส่ผัก"
          className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-black"
          rows={3}
        />
      </div>

      {/* Fixed Bottom */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-3">
          <span className="text-lg font-semibold">ยอดรวม</span>
          <span className="text-2xl font-bold text-green-600">{totalPrice.toFixed(2)}</span>
        </div>

        <button
          onClick={handleCreateOrder}
          disabled={isSubmitting}
          className="w-full py-3 bg-green-500 text-white font-bold rounded-full hover:bg-green-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? "กำลังสั่งอาหาร..." : "สั่งอาหาร"}
        </button>
      </div>
    </div>
  );
}
