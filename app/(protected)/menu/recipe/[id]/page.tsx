"use client";

import Image from "next/image";
import { useMenu } from "@/lib/hooks/useMenu";
import React from "react";
import Header from "@/components/common/Header";

export default function RecipePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { menus } = useMenu();

  // รองรับทั้งกรณี params เป็น object หรือ Promise
  const [id, setId] = React.useState<string | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    const getId = async () => {
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

  if (!id) {
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

  // Parse recipe if it's JSON, otherwise treat as plain text
  let recipeSteps: string[] = [];
  try {
    if (menu.recipe) {
      const parsed = JSON.parse(menu.recipe);
      if (Array.isArray(parsed)) {
        recipeSteps = parsed;
      } else {
        recipeSteps = [menu.recipe];
      }
    }
  } catch {
    recipeSteps = menu.recipe ? [menu.recipe] : [];
  }

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <Header 
        title= "สูตรอาหาร"
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
      <div className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-bold text-gray-900">{menu.menu_name}</h2>
          <p className="text-2xl font-bold text-orange-500">{menu.price}</p>
        </div>

        {/* Ingredients - Placeholder */}
        <div className="mb-6">
          <h3 className="text-lg font-bold text-gray-900 mb-3">ส่วนผสม :</h3>
          <div className="space-y-2 text-gray-700">
            <div className="flex justify-between border-b pb-2">
              <span>• เส้นสปาเก็ตตี้</span>
              <span className="text-sm">120 กรัม</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• กุ้งสด</span>
              <span className="text-sm">3-4 ตัว</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• เข้าผักเคลอซัง แดง</span>
              <span className="text-sm">1/4 ถ้วย</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• หัวไซโป้ส้น</span>
              <span className="text-sm">1 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• ถ้วงดก</span>
              <span className="text-sm">1 ถ้วย</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• ใบกะเพรามอน</span>
              <span className="text-sm">1/2 ถ้วย</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• ต้าลองคร้ง</span>
              <span className="text-sm">2 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• น้ำปลา</span>
              <span className="text-sm">2 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• น้ำมันหม</span>
              <span className="text-sm">3 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• น้ำตาลปลา</span>
              <span className="text-sm">2 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• ไม่ใส่</span>
              <span className="text-sm">1 ฟอง</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• น้ำปลา</span>
              <span className="text-sm">1.5 ช้อนโต๊ะ</span>
            </div>
            <div className="flex justify-between border-b pb-2">
              <span>• ฟักนิ่น</span>
              <span className="text-sm">ตามชอบ</span>
            </div>
          </div>
        </div>

        {/* Recipe Steps */}
        {recipeSteps.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-bold text-gray-900 mb-3">สูตรอาหาร :</h3>
            <ol className="space-y-3 text-gray-700">
              {recipeSteps.map((step, index) => (
                <li key={index} className="flex gap-2">
                  <span className="font-semibold">{index + 1}.</span>
                  <span>{step}</span>
                </li>
              ))}
            </ol>
          </div>
        )}

        {!menu.recipe && (
          <div className="text-center text-gray-400 py-8">
            ยังไม่มีสูตรอาหาร
          </div>
        )}
      </div>
    </div>
  );
}
