"use client";

import Image from "next/image";
import { Plus, ChefHat, Edit } from "lucide-react";
import type { Menu } from "@/lib/hooks/useMenu";

interface MenuCardProps {
  menu: Menu;
  role: "customer" | "staff" | "admin";
  onCardClick: (menu: Menu) => void;
  onRecipeClick?: (menu: Menu) => void;
  onEditClick?: (menu: Menu) => void;
}

export default function MenuCard({
  menu,
  role,
  onCardClick,
  onRecipeClick,
  onEditClick,
}: MenuCardProps) {
  const handleActionClick = (e: React.MouseEvent, action: () => void) => {
    e.stopPropagation();
    action();
  };

  return (
    <div
      onClick={() => onCardClick(menu)}
      className="flex items-center gap-3 px-1 py-3 bg-white border-b border-gray-200 hover:bg-gray-50 cursor-pointer"
    >
      {/* Menu Image */}
      <div className="relative w-16 h-16 flex-shrink-0">
        {menu.menu_image_url ? (
          <Image
            src={menu.menu_image_url}
            alt={menu.menu_name}
            width={64}
            height={64}
            className="w-full h-full rounded-lg object-cover"
          />
        ) : (
          <div className="w-full h-full rounded-lg bg-gray-200 flex items-center justify-center">
            <ChefHat size={24} className="text-gray-400" />
          </div>
        )}
      </div>

      {/* Menu Info */}
      <div className="flex-1 min-w-0">
        <h3
          className={`font-semibold truncate ${
            menu.is_available ? "text-gray-900" : "text-red-600"
          }`}
        >
          {menu.menu_name}
        </h3>
        <p className="text-sm text-gray-600">ราคา : {menu.price} บาท</p>
      </div>

      {/* Action Button based on Role */}
      <div className="flex-shrink-0">
        {role === "customer" && (
          <button
            onClick={(e) => handleActionClick(e, () => onCardClick(menu))}
            className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center hover:bg-green-600 transition-colors"
          >
            <Plus size={20} className="text-white" />
          </button>
        )}

        {role === "staff" && onRecipeClick && (
          <button
            onClick={(e) => handleActionClick(e, () => onRecipeClick(menu))}
            className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center hover:bg-gray-200 transition-colors"
          >
            <ChefHat size={20} className="text-gray-700" />
          </button>
        )}

        {role === "admin" && (
          <div className="flex items-center gap-2">
            {onEditClick && (
              <button
                onClick={(e) => handleActionClick(e, () => onEditClick(menu))}
                className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center hover:bg-blue-200 transition-colors"
              >
                <Edit size={16} className="text-gray-800" />
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
