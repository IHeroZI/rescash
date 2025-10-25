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

type FilterType = "all" | "available" | "unavailable";

export default function MenuPage() {
  const router = useRouter();
  const { userData } = useUser();
  const totalItems = useCartStore((state) => state.getTotalItems());
  
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const { menus } = useMenuSearch(searchQuery);

  if (!userData) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  const role = userData.role;
  
  // Filter menus based on role and filter
  const filteredMenus = menus.filter((menu) => {
    // For customer and staff, show only available menus
    if (role === "customer" || role === "staff") {
      return menu.is_available === true;
    }
    
    // For admin, apply filter
    if (filter === "available") return menu.is_available === true;
    if (filter === "unavailable") return menu.is_available === false;
    return true; // "all" - show both true and false
  });

  console.log("Role:", role);
  console.log("Filter:", filter);
  console.log("Total menus:", menus.length);
  console.log("Filtered menus:", filteredMenus.length);

  return (
    <div className="flex flex-col h-screen bg-white">
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
          <div className="mt-3 space-y-3">
            {/* Filter Buttons */}
            <div className="flex gap-2">
              <button
                onClick={() => setFilter("all")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "all"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ทั้งหมด
              </button>
              <button
                onClick={() => setFilter("available")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "available"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                เปิดใช้งาน
              </button>
              <button
                onClick={() => setFilter("unavailable")}
                className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === "unavailable"
                    ? "bg-gray-800 text-white"
                    : "bg-gray-100 text-gray-600 hover:bg-gray-200"
                }`}
              >
                ปิดใช้งาน
              </button>
            </div>

            {/* Add Button */}
            <button
              onClick={() => router.push("/menu/add")}
              className="w-full px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2 font-medium"
            >
              <span className="text-xl">+</span>
              <span>เพิ่มเมนู</span>
            </button>
          </div>
        )}

        {role === "staff" && (
          <div className="mt-3 text-sm text-gray-600 text-center">
            จำนวนเมนู: {filteredMenus.length}
          </div>
        )}
      </div>

      {/* Menu List */}
      <div className="flex-1 p-4 pb-20 overflow-y-auto scrollbar-hide">
        {filteredMenus.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            {searchQuery ? "ไม่พบเมนูที่ค้นหา" : "ไม่มีเมนู"}
          </div>
        ) : (
          filteredMenus.map((menu) => (
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
              onEditClick={(menu) => router.push(`/menu/edit/${menu.menu_id}`)}
            />
          ))
        )}
      </div>

      <NavBar />
    </div>
  );
}
