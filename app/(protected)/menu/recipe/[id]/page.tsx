"use client";

import Image from "next/image";
import { useMenu } from "@/lib/hooks/useMenu";
import React from "react";
import Header from "@/components/common/Header";

interface MenuIngredient {
  quantity_required: number;
  ingredient: {
    ingredient_name: string;
    unit_of_measure: string;
  };
}

export default function RecipePage({ params }: { params: { id: string } | Promise<{ id: string }> }) {
  const { menus } = useMenu();
  const [id, setId] = React.useState<string | null>(null);
  const [ingredients, setIngredients] = React.useState<MenuIngredient[]>([]);
  const [loadingIngredients, setLoadingIngredients] = React.useState(true);

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

  React.useEffect(() => {
    if (!id) return;

    const fetchIngredients = async () => {
      try {
        // Fetch ingredients via API
        const response = await fetch(`/api/menus/${id}/ingredients`);
        const result = await response.json();

        if (!response.ok) {
          throw new Error(result.error || 'Failed to fetch ingredients');
        }
        
        console.log("Ingredients data:", result.data);
        
        if (result.success && result.data) {
          setIngredients(result.data.map((item: {
            quantity_required: number;
            ingredient_name: string;
            unit_of_measure: string;
          }) => ({
            quantity_required: item.quantity_required,
            ingredient: {
              ingredient_name: item.ingredient_name,
              unit_of_measure: item.unit_of_measure,
            },
          })));
        }
      } catch (error) {
        console.log("Error fetching ingredients:", error);
      } finally {
        setLoadingIngredients(false);
      }
    };

    fetchIngredients();
  }, [id]);

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

  // Parse recipe - split by newlines if plain text
  let recipeSteps: string[] = [];
  if (menu.recipe) {
    // Split by newline and filter out empty lines
    recipeSteps = menu.recipe
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0);
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      {/* Header */}
      <Header 
        title="สูตรอาหาร"
        backHref="/menu" 
        showNotificationIcon={true} 
      />

      <div className="flex-1 overflow-y-auto scrollbar-hide">
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
        <div className="p-6 space-y-6">
          {/* Title and Price */}
          <div className="flex items-start justify-between gap-4">
            <h2 className="text-2xl font-bold text-gray-900 flex-1">{menu.menu_name}</h2>
            <p className="text-2xl font-bold text-orange-600">{menu.price}</p>
          </div>

          {/* Ingredients */}
          <div>
            <h3 className="text-lg font-bold text-gray-900 mb-3">ส่วนผสม :</h3>
            {loadingIngredients ? (
              <p className="text-gray-500">กำลังโหลด...</p>
            ) : ingredients.length === 0 ? (
              <p className="text-gray-400">ยังไม่มีข้อมูลส่วนผสม</p>
            ) : (
              <div className="space-y-2">
                {ingredients.map((item, index) => (
                  <div
                    key={index}
                    className="flex items-center gap-2 text-gray-700"
                  >
                    <span className="mt-1.5">•</span>
                    <div className="flex-1 grid grid-cols-3 gap-2 items-center">
                      <span className="truncate col-span-2">{item.ingredient.ingredient_name}</span>
                      <span className="flex justify-end gap-1">
                        <span className="min-w-[40px] text-right">{item.quantity_required ?? "-"}</span>
                        <span className="text-gray-500">{item.ingredient.unit_of_measure}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recipe Steps */}
          {recipeSteps.length > 0 && (
            <div>
              <h3 className="text-lg font-bold text-gray-900 mb-3">สูตรอาหาร :</h3>
              <ol className="space-y-3">
                {recipeSteps.map((step, index) => (
                  <li key={index} className="flex gap-2 text-gray-700 items-start">
                    <span className="font-semibold w-6 text-right">{index + 1}.</span>
                    <span className="flex-1 pl-2">{step}</span>
                  </li>
                ))}
              </ol>
            </div>
          )}

          {!menu.recipe && (
            <div className="text-center text-gray-400 py-8 border-t">
              ยังไม่มีสูตรอาหาร
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
