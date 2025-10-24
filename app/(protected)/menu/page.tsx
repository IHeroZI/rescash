"use client";

import { useState } from "react";
import { ShoppingCart, Bell } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import MenuCard from "@/components/menu/MenuCard";
import NavBar from "@/components/common/NavBar";
import SearchBar from "@/components/common/SearchBar";
import { useMenuSearch } from "@/lib/hooks/useMenuSearch";
import { useUser } from "@/lib/hooks/useUser";
import { useCartStore } from "@/lib/store/cartStore";

export default function MenuPage() {
  const router = useRouter();
  const { userData } = useUser();
  const totalItems = useCartStore((state) => state.getTotalItems());
  
  const [searchQuery, setSearchQuery] = useState("");
  const { menus } = useMenuSearch(searchQuery);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  const role = userData.role;
  const availableMenus = role === "customer" ? menus.filter((m) => m.is_available) : menus;

  return (
    <div className="min-h-screen bg-white pb-20">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-white border-b border-gray-200 px-4 py-3">
        <div className="flex items-center justify-between mb-3">
          {role === "customer" && (
            <Link href="/cart" className="relative">
              <ShoppingCart size={24} />
              {totalItems > 0 && (
                <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 text-white text-xs rounded-full flex items-center justify-center">
                  {totalItems}
                </span>
              )}
            </Link>
          )}
          <h1 className="text-2xl font-bold flex-1 text-center">เมนู</h1>
          <Bell size={24} />
        </div>

        {/* Search */}
        <SearchBar 
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาเมนูอาหาร"
        />

        {role === "admin" && (
          <div className="mt-3 flex items-center justify-between">
            <span className="text-sm text-gray-600">จำนวนเมนู : {menus.length}</span>
            <button
              onClick={() => router.push("/menu/add")}
              className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 flex items-center gap-2"
            >
              <span className="text-xl">+</span>
              <span>เพิ่มเมนู</span>
            </button>
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="p-4">
        {availableMenus.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {searchQuery ? "ไม่พบเมนูที่ค้นหา" : "ไม่มีเมนู"}
          </div>
        ) : (
          availableMenus.map((menu) => (
            <MenuCard
              key={menu.menu_id}
              menu={menu}
              role={role}
              onCardClick={(menu) => {
                if (role === "customer") {
                  router.push(`/menu/${menu.menu_id}`);
                } else if (role === "staff") {
                  router.push(`/menu/recipe/${menu.menu_id}`);
                }
              }}
              onRecipeClick={(menu) => router.push(`/menu/recipe/${menu.menu_id}`)}
              onEditClick={(menu) => router.push(`/admin/menu/edit/${menu.menu_id}`)}
              onToggleAvailability={(menu) => {
                // TODO: Implement toggle availability
                console.log("Toggle availability", menu);
              }}
            />
          ))
        )}
      </div>

      <NavBar />
    </div>
  );
}
