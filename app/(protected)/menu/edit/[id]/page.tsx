"use client";

import { useState, useEffect } from "react";
import Header from "@/components/common/Header";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import Image from "next/image";
import { Upload, X, Plus } from "lucide-react";
import { useIngredients } from "@/lib/hooks/useIngredients";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

interface MenuIngredient {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  quantity_required: number;
}

export default function EditMenuPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { ingredients } = useIngredients();
  const [menuId, setMenuId] = useState<number | null>(null);
  const [menuName, setMenuName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [recipe, setRecipe] = useState("");
  const [isAvailable, setIsAvailable] = useState(true);
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [originalImageUrl, setOriginalImageUrl] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<MenuIngredient[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // For adding ingredient
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // For editing existing ingredients
  const [editingIngredientId, setEditingIngredientId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");

  useEffect(() => {
    params.then((resolvedParams) => {
      const id = parseInt(resolvedParams.id);
      setMenuId(id);
      fetchMenu(id);
    });
  }, [params]);

  const fetchMenu = async (id: number) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Fetch menu data
      const { data: menuData, error: menuError } = await supabase
        .from("menu")
        .select("*")
        .eq("menu_id", id)
        .single();

      if (menuError) throw menuError;

      setMenuName(menuData.menu_name);
      setDescription(menuData.description || "");
      setPrice(menuData.price.toString());
      setRecipe(menuData.recipe || "");
      setIsAvailable(menuData.is_available);
      setImagePreview(menuData.menu_image_url);
      setOriginalImageUrl(menuData.menu_image_url);

      // Fetch menu ingredients
      const { data: ingredientsData, error: ingredientsError } = await supabase
        .from("menuIngredient")
        .select(`
          quantity_required,
          ingredient:ingredient_id (
            ingredient_id,
            ingredient_name,
            unit_of_measure
          )
        `)
        .eq("menu_id", id);

      if (ingredientsError) throw ingredientsError;

      if (ingredientsData) {
        const formattedIngredients = ingredientsData.map((item) => {
          const ing = Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient;
          return {
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            unit_of_measure: ing.unit_of_measure,
            quantity_required: item.quantity_required,
          };
        });
        setSelectedIngredients(formattedIngredients);
      }
    } catch (error) {
      console.log("Error fetching menu:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    } finally {
      setLoading(false);
    }
  };

  const availableIngredients = ingredients.filter((ing) => ing.is_available);
  const filteredIngredients = availableIngredients.filter((ing) =>
    ing.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIngredient = availableIngredients.find(
    (ing) => ing.ingredient_id === selectedIngredientId
  );

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddIngredient = () => {
    if (!selectedIngredient) {
      toast.error("กรุณาเลือกวัตถุดิบ");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
      return;
    }

    const exists = selectedIngredients.find(
      (item) => item.ingredient_id === selectedIngredient.ingredient_id
    );

    if (exists) {
      setSelectedIngredients(
        selectedIngredients.map((item) =>
          item.ingredient_id === selectedIngredient.ingredient_id
            ? { ...item, quantity_required: parseFloat(quantity) }
            : item
        )
      );
      toast.success("อัปเดตรายการแล้ว");
    } else {
      setSelectedIngredients([
        ...selectedIngredients,
        {
          ingredient_id: selectedIngredient.ingredient_id,
          ingredient_name: selectedIngredient.ingredient_name,
          unit_of_measure: selectedIngredient.unit_of_measure,
          quantity_required: parseFloat(quantity),
        },
      ]);
      toast.success("เพิ่มรายการแล้ว");
    }

    // Reset
    setSearchQuery("");
    setSelectedIngredientId("");
    setQuantity("");
  };

  const handleRemoveIngredient = (ingredientId: number) => {
    setSelectedIngredients(
      selectedIngredients.filter((item) => item.ingredient_id !== ingredientId)
    );
  };

  const uploadImage = async (file: File): Promise<string> => {
    const { createClient } = await import("@/lib/supabase/client");
    const supabase = createClient();

    const fileExt = file.name.split(".").pop();
    const fileName = `${Math.random().toString(36).substring(2)}.${fileExt}`;
    const filePath = `menus/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from("images")
      .upload(filePath, file);

    if (uploadError) throw uploadError;

    const {
      data: { publicUrl },
    } = supabase.storage.from("images").getPublicUrl(filePath);

    return publicUrl;
  };

  const handleConfirmSave = () => {
    if (!menuName.trim()) {
      toast.error("กรุณาระบุชื่อเมนู");
      return;
    }
    if (!price || parseFloat(price) <= 0) {
      toast.error("กรุณาระบุราคาที่ถูกต้อง");
      return;
    }
    if (!imagePreview) {
      toast.error("กรุณาเลือกรูปภาพ");
      return;
    }
    if (selectedIngredients.length === 0) {
      toast.error("กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ");
      return;
    }

    setShowConfirm(true);
  };

  const handleSave = async () => {
    if (!menuId) return;

    try {
      setSaving(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Upload new image if selected
      let imageUrl = originalImageUrl;
      if (imageFile) {
        imageUrl = await uploadImage(imageFile);
      }

      // Update menu
      const { error: menuError } = await supabase
        .from("menu")
        .update({
          menu_name: menuName.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          menu_image_url: imageUrl,
          recipe: recipe.trim() || null,
          is_available: isAvailable,
        })
        .eq("menu_id", menuId);

      if (menuError) throw menuError;

      // Delete old menu ingredients
      const { error: deleteError } = await supabase
        .from("menuIngredient")
        .delete()
        .eq("menu_id", menuId);

      if (deleteError) throw deleteError;

      // Insert new menu ingredients
      const menuIngredients = selectedIngredients.map((item) => ({
        menu_id: menuId,
        ingredient_id: item.ingredient_id,
        quantity_required: item.quantity_required,
      }));

      console.log("Inserting menu ingredients:", menuIngredients);

      const { error: ingredientsError } = await supabase
        .from("menuIngredient")
        .insert(menuIngredients);

      if (ingredientsError) {
        console.log("Error inserting ingredients:", ingredientsError);
        throw ingredientsError;
      }

      toast.success("แก้ไขเมนูสำเร็จ");
      router.push("/menu");
    } catch (error) {
      console.log("Error saving menu:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <Header title="แก้ไขเมนู" backHref="/menu" showNotificationIcon={true} />
        <div className="flex-1 flex items-center justify-center">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="แก้ไขเมนู" backHref="/menu" showNotificationIcon={true} />
      <div className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="p-4 space-y-6 max-w-2xl mx-auto pb-24">
          {/* Image upload */}
          <div className="bg-white p-4 rounded-lg border space-y-3">
          <h2 className="font-semibold text-gray-900">รูปภาพเมนู</h2>
          {imagePreview ? (
            <div className="relative w-full aspect-video rounded-lg overflow-hidden bg-gray-200">
              <Image src={imagePreview} alt="Menu preview" fill className="object-cover" />
              <button
                onClick={() => {
                  setImageFile(null);
                  setImagePreview(originalImageUrl);
                }}
                className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
              >
                <X size={20} />
              </button>
            </div>
          ) : (
            <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
              <Upload size={40} className="text-gray-400 mb-2" />
              <span className="text-gray-500">คลิกเพื่อเลือกรูปภาพ</span>
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
          )}
        </div>

        {/* Menu info */}
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h2 className="font-semibold text-gray-900">ข้อมูลเมนู</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ชื่อเมนู</label>
            <input
              type="text"
              value={menuName}
              onChange={(e) => setMenuName(e.target.value)}
              placeholder="กรอกชื่อเมนู"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">คำอธิบาย</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={3}
              placeholder="กรอกคำอธิบาย (ถ้ามี)"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">ราคา (฿)</label>
            <input
              type="number"
              value={price}
              onChange={(e) => setPrice(e.target.value)}
              placeholder="0.00"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">สูตรอาหาร</label>
            <textarea
              value={recipe}
              onChange={(e) => setRecipe(e.target.value)}
              rows={6}
              placeholder="กรอกวิธีทำอาหารทีละขั้นตอน แยกด้วยการขึ้นบรรทัดใหม่"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
            />
            <p className="text-xs text-gray-500 mt-1">แต่ละขั้นตอนขึ้นบรรทัดใหม่</p>
          </div>

          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-gray-700">สถานะการขาย</label>
            <button
              onClick={() => setIsAvailable(!isAvailable)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                isAvailable ? "bg-gray-800" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  isAvailable ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
          <p className="text-sm text-gray-500">
            {isAvailable ? "เมนูนี้เปิดขายอยู่" : "เมนูนี้ปิดขายอยู่"}
          </p>
        </div>

        {/* Add ingredients */}
        <div className="bg-white p-4 rounded-lg border space-y-4">
          <h2 className="font-semibold text-gray-900">เพิ่มวัตถุดิบ</h2>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">เลือกวัตถุดิบ</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                setSearchQuery(e.target.value);
                setSelectedIngredientId("");
                setShowSuggestions(true);
              }}
              onFocus={() => setShowSuggestions(true)}
              placeholder="ค้นหาวัตถุดิบ..."
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
            {showSuggestions && searchQuery && filteredIngredients.length > 0 && (
              <div className="mt-1 max-h-40 overflow-y-auto border rounded-lg bg-white shadow-lg">
                {filteredIngredients.map((ing) => (
                  <button
                    key={ing.ingredient_id}
                    onClick={() => {
                      setSelectedIngredientId(ing.ingredient_id);
                      setSearchQuery(ing.ingredient_name);
                      setShowSuggestions(false);
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-100 transition-colors"
                  >
                    <p className="font-medium">{ing.ingredient_name}</p>
                    <p className="text-sm text-gray-500">หน่วย: {ing.unit_of_measure}</p>
                  </button>
                ))}
              </div>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              จำนวนที่ใช้
              {selectedIngredient && (
                <span className="text-gray-500"> ({selectedIngredient.unit_of_measure})</span>
              )}
            </label>
            <input
              type="number"
              value={quantity}
              onChange={(e) => setQuantity(e.target.value)}
              placeholder="0"
              step="0.01"
              min="0"
              className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
            />
          </div>

          <button
            onClick={handleAddIngredient}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            <span>เพิ่มวัตถุดิบ</span>
          </button>
        </div>

        {/* Selected ingredients list */}
        {selectedIngredients.length > 0 && (
          <div className="bg-white p-4 rounded-lg border space-y-3">
            <h2 className="font-semibold text-gray-900">วัตถุดิบที่เลือก</h2>
            <div className="space-y-2">
              {selectedIngredients.map((item) => (
                <div
                  key={item.ingredient_id}
                  className="p-3 bg-white rounded-lg"
                >
                  {editingIngredientId === item.ingredient_id ? (
                    // Edit mode
                    <div className="space-y-2">
                      <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                      <div>
                        <label className="text-xs text-gray-600">จำนวน ({item.unit_of_measure})</label>
                        <input
                          type="number"
                          value={editQuantity}
                          onChange={(e) => setEditQuantity(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            if (!editQuantity || parseFloat(editQuantity) <= 0) {
                              toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
                              return;
                            }
                            setSelectedIngredients(
                              selectedIngredients.map((ing) =>
                                ing.ingredient_id === item.ingredient_id
                                  ? { ...ing, quantity_required: parseFloat(editQuantity) }
                                  : ing
                              )
                            );
                            setEditingIngredientId(null);
                            toast.success("อัปเดตจำนวนแล้ว");
                          }}
                          className="flex-1 px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                        >
                          บันทึก
                        </button>
                        <button
                          onClick={() => setEditingIngredientId(null)}
                          className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                        >
                          ยกเลิก
                        </button>
                      </div>
                    </div>
                  ) : (
                    // View mode
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                        <p className="text-sm text-gray-600">
                          {item.quantity_required} {item.unit_of_measure}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => {
                            setEditingIngredientId(item.ingredient_id);
                            setEditQuantity(item.quantity_required.toString());
                          }}
                          className="p-1 text-gray-600 hover:bg-gray-200 rounded transition-colors"
                          title="แก้ไข"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                          </svg>
                        </button>
                        <button
                          onClick={() => handleRemoveIngredient(item.ingredient_id)}
                          className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                          title="ลบ"
                        >
                          <X size={18} />
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
        </div>
      </div>

      {/* Action buttons - Fixed at bottom */}
      <div className="flex gap-3 p-4 bg-white border-t">
        <button
          onClick={() => router.back()}
          disabled={saving}
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
        >
          ยกเลิก
        </button>
        <button
          onClick={handleConfirmSave}
          disabled={saving}
          className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          บันทึก
        </button>
      </div>

      {/* Confirm dialog */}
      <ConfirmDialog
        isOpen={showConfirm}
        onClose={() => setShowConfirm(false)}
        onConfirm={handleSave}
        title="ยืนยันการแก้ไข"
        message={`คุณต้องการบันทึกการแก้ไขเมนู "${menuName}" ใช่หรือไม่?`}
        confirmText="ยืนยัน"
        confirmColor="bg-gray-800 hover:bg-gray-700"
      />
    </div>
  );
}
