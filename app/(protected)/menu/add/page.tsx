"use client";

import { useState } from "react";
import Header from "@/components/common/Header";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import ErrorLabel from "@/components/common/ErrorLabel";
import Image from "next/image";
import { Upload, X, Plus } from "lucide-react";
import { useIngredients } from "@/lib/hooks/useIngredients";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { validateMenu } from "@/lib/validation/validationSchemas";

interface MenuIngredient {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  quantity_required: number;
}

export default function AddMenuPage() {
  const router = useRouter();
  const { ingredients } = useIngredients();
  const [menuName, setMenuName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [recipe, setRecipe] = useState("");
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string>("");
  const [selectedIngredients, setSelectedIngredients] = useState<MenuIngredient[]>([]);
  const [saving, setSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // For adding ingredient
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

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
      toast.error("กรุณาเลือกวัตถุดิบที่มีอยู่ในระบบ");
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
    setErrors({});

    // Validate menu data
    const validation = validateMenu({
      menu_name: menuName,
      description: description,
      price: parseFloat(price) || undefined,
      recipe: recipe
    });

    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    // Additional validations
    if (!imageFile) {
      setErrors({ ...errors, image: "กรุณาเลือกรูปภาพ" });
      return;
    }
    if (selectedIngredients.length === 0) {
      toast.error("กรุณาเลือกวัตถุดิบอย่างน้อย 1 รายการ");
      return;
    }

    setShowConfirm(true);
  };

  const handleSave = async () => {
    try {
      setSaving(true);

      // Upload image
      const imageUrl = await uploadImage(imageFile!);

      // Prepare ingredients data
      const ingredients = selectedIngredients.map((item) => ({
        ingredient_id: item.ingredient_id,
        quantity_required: item.quantity_required,
      }));

      // Create menu via API
      const response = await fetch('/api/menus', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          menu_name: menuName.trim(),
          description: description.trim() || null,
          price: parseFloat(price),
          menu_image_url: imageUrl,
          recipe: recipe.trim() || null,
          is_available: true,
          ingredients: ingredients,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to create menu');
      }

      toast.success("เพิ่มเมนูสำเร็จ");
      router.push("/menu");
    } catch (error) {
      console.log("Error saving menu:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
      setShowConfirm(false);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="เพิ่มเมนูใหม่" backHref="/menu" showNotificationIcon={true} />
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
                    setImagePreview("");
                  }}
                  className="absolute top-2 right-2 p-2 bg-red-500 text-white rounded-full hover:bg-red-600 transition-colors"
                >
                  <X size={20} />
                </button>
              </div>
            ) : (
              <label className="flex flex-col items-center justify-center w-full aspect-video border-2 border-dashed rounded-lg cursor-pointer hover:bg-white transition-colors">
                <Upload size={40} className="text-gray-400 mb-2" />
                <span className="text-gray-500">คลิกเพื่อเลือกรูปภาพ</span>
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            )}
            <ErrorLabel message={errors.image} />
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
              <ErrorLabel message={errors.menu_name} />
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
              <ErrorLabel message={errors.description} />
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
              <ErrorLabel message={errors.price} />
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
              <ErrorLabel message={errors.recipe} />
            </div>
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
                  className="flex items-center justify-between p-3 bg-white rounded-lg"
                >
                  <div>
                    <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                    <p className="text-sm text-gray-600">
                      {item.quantity_required} {item.unit_of_measure}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRemoveIngredient(item.ingredient_id)}
                    className="p-1 text-red-500 hover:bg-red-50 rounded transition-colors"
                  >
                    <X size={18} />
                  </button>
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
          className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-white transition-colors disabled:opacity-50"
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
        title="ยืนยันการเพิ่มเมนู"
        message={`คุณต้องการเพิ่มเมนู "${menuName}" ราคา ฿${parseFloat(price).toLocaleString("th-TH", { minimumFractionDigits: 2 })} ใช่หรือไม่?`}
        confirmText="ยืนยัน"
        confirmColor="bg-gray-800 hover:bg-gray-700"
      />
    </div>
  );
}
