"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Minus, Plus } from "lucide-react";
import Image from "next/image";
import { useCartStore } from "@/lib/store/cartStore";
import { useMenu } from "@/lib/hooks/useMenu";
import toast from "react-hot-toast";
import React from "react";
import Header from "@/components/common/Header";

export default function MenuDetailPage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const router = useRouter();
  const { menus, loading } = useMenu();
  const addItem = useCartStore((state) => state.addItem);
  const [quantity, setQuantity] = useState(1);

  // รองรับทั้งกรณี params เป็น object หรือ Promise
  const [id, setId] = useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const getId = async () => {
      // เช็คว่า params เป็น Promise หรือ object
      if (typeof (params as Promise<{ id: string }>).then === "function") {
        const awaited = await (params as Promise<{ id: string }>);
        if (!cancelled) setId(awaited.id);
      } else {
        setId((params as { id: string }).id);
      }
    };
    getId();
    return () => { cancelled = true; };
  }, [params]);

  if (!id || loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-400">กำลังโหลด...</div>
      </div>
    );
  }

  const menu = menus.find((m) => m.menu_id === Number(id));

  if (!menu) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-red-600">ไม่พบเมนูนี้</div>
      </div>
    );
  }

  const totalPrice = menu.price * quantity;

  const handleAddToCart = () => {
    addItem(
      {
        menu_id: menu.menu_id,
        menu_name: menu.menu_name,
        price: menu.price,
        menu_image_url: menu.menu_image_url,
      },
      quantity
    );
    toast.success(`เพิ่ม ${menu.menu_name} ลงตะกร้าแล้ว`);
    router.push("/menu");
  };

  return (
    <div className="min-h-screen pb-24">
      {/* Header */}
      <Header 
        title= "รายละเอียดเมนู"
        backHref="/menu" 
        showNotificationIcon={true} 
      />

      {/* Menu Image */}
      <div className="relative w-full h-64 bg-gray-200">
        {menu.menu_image_url ? (
          <Image
            src={menu.menu_image_url}
            alt={menu.menu_name}
            fill
            className="object-cover"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <span className="text-gray-400">ไม่มีรูปภาพ</span>
          </div>
        )}
      </div>

      {/* Menu Info */}
      <div className="p-6 rounded-t-2xl bg-white relative z-10 -mt-12">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900">{menu.menu_name}</h2>
          <p className="text-2xl font-bold text-orange-500">{menu.price}</p>
        </div>
        {menu.description && (
          <div className="mb-6">
            <h3 className="font-semibold text-gray-900 mb-2">คำอธิบาย :</h3>
            <p className="text-gray-600">{menu.description}</p>
          </div>
        )}
      </div>

      {/* Fixed Bottom Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 p-4 max-w-sm mx-auto">
        <div className="flex items-center justify-between mb-1">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="w-10 h-10 bg-red-500 rounded-full flex items-center justify-center hover:bg-red-600 transition-colors"
            >
              <Minus size={20} className="text-white" />
            </button>
            <span className="text-xl font-bold w-8 text-center">{quantity}</span>
            <button
              onClick={() => setQuantity(quantity + 1)}
              className="w-10 h-10 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
            >
              <Plus size={20} className="text-white" />
            </button>
          </div>
          <button
          onClick={handleAddToCart}
          className="w-full py-3 ml-4 bg-green-500 text-white font-bold rounded-2xl hover:bg-green-600 transition-colors"
        >
          เพิ่มลงตะกร้า {totalPrice} บาท
        </button>
        </div>

        
      </div>
    </div>
  );
}
