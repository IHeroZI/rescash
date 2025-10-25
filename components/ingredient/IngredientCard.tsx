"use client";

import { Edit2 } from "lucide-react";
import type { Ingredient } from "@/lib/hooks/useIngredients";

interface IngredientCardProps {
  ingredient: Ingredient;
  onEdit: (ingredient: Ingredient) => void;
}

export default function IngredientCard({ ingredient, onEdit }: IngredientCardProps) {
  return (
    <div
      className={`p-4 border-b flex items-center justify-between transition-colors bg-white border-gray-200`}
      
    >
      <div className="flex-1">
        <h3
          className={`font-semibold ${
            ingredient.is_available ? "text-gray-900" : "text-red-400"
          }`}
        >
          {ingredient.ingredient_name}
        </h3>
        <p className="text-sm text-gray-500">หน่วย: {ingredient.unit_of_measure}</p>
      </div>
      <button
        onClick={() => onEdit(ingredient)}
        className="p-2 hover:bg-gray-100 rounded-full transition-colors"
      >
        <Edit2 size={18} className="text-gray-600" />
      </button>
    </div>
  );
}
