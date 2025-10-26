"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import Header from "@/components/common/Header";
import SearchBar from "@/components/common/SearchBar";
import IngredientCard from "@/components/ingredient/IngredientCard";
import IngredientFormModal from "@/components/ingredient/IngredientFormModal";
import { useIngredients } from "@/lib/hooks/useIngredients";
import type { Ingredient } from "@/lib/hooks/useIngredients";

type FilterType = "all" | "available" | "unavailable";

export default function IngredientManagementPage() {
  const { ingredients, loading, refetch } = useIngredients();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("all");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedIngredient, setSelectedIngredient] = useState<Ingredient | null>(null);

  // Filter ingredients
  const filteredIngredients = ingredients
    .filter((ing) => {
      // Search filter
      if (searchQuery.trim()) {
        return ing.ingredient_name
          .toLowerCase()
          .includes(searchQuery.toLowerCase());
      }
      return true;
    })
    .filter((ing) => {
      // Status filter
      if (filter === "available") return ing.is_available;
      if (filter === "unavailable") return !ing.is_available;
      return true;
    });

  const handleEdit = (ingredient: Ingredient) => {
    setSelectedIngredient(ingredient);
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedIngredient(null);
    setIsModalOpen(true);
  };

  const handleModalClose = () => {
    setIsModalOpen(false);
    setSelectedIngredient(null);
  };

  const handleSuccess = () => {
    refetch();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header
        title="จัดการวัตถุดิบ"
        backHref="/more"
        showNotificationIcon={true}
      />

      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-hide">
        {/* Search */}
        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาวัตถุดิบ"
        />

        {/* Filter + Add Button */}
        <div className="flex items-center justify-between">
          <div className="flex gap-2">
            <button
              onClick={() => setFilter("all")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "all"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ทั้งหมด
            </button>
            <button
              onClick={() => setFilter("available")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "available"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              เปิดใช้งาน
            </button>
            <button
              onClick={() => setFilter("unavailable")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === "unavailable"
                  ? "bg-black text-white"
                  : "bg-gray-100 text-gray-600 hover:bg-gray-200"
              }`}
            >
              ปิดใช้งาน
            </button>
          </div>

          <button
            onClick={handleAdd}
            className="px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2"
          >
            <Plus size={20} />
            <span>เพิ่ม</span>
          </button>
        </div>

        {/* Count */}
        <div className="text-sm text-gray-600">
          จำนวนวัตถุดิบ: {filteredIngredients.length}
        </div>

        {/* Ingredients List */}
        <div className="flex-1 overflow-y-auto scrollbar-hide">
          {filteredIngredients.length === 0 ? (
            <div className="text-center text-gray-400 py-12">
              {searchQuery ? "ไม่พบวัตถุดิบที่ค้นหา" : "ไม่มีวัตถุดิบ"}
            </div>
          ) : (
            filteredIngredients.map((ingredient) => (
              <IngredientCard
                key={ingredient.ingredient_id}
                ingredient={ingredient}
                onEdit={handleEdit}
              />
            ))
          )}
        </div>
      </div>

      {/* Modal */}
      <IngredientFormModal
        isOpen={isModalOpen}
        onClose={handleModalClose}
        onSuccess={handleSuccess}
        ingredient={selectedIngredient}
      />
    </div>
  );
}
