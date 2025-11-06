"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import ErrorLabel from "@/components/common/ErrorLabel";
import { validateIngredient } from "@/lib/validation/validationSchemas";
import toast from "react-hot-toast";

interface IngredientFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  ingredient?: {
    ingredient_id: number;
    ingredient_name: string;
    unit_of_measure: string;
    is_available: boolean;
  } | null;
}

const UNITS = [
  "กรัม",
  "กิโลกรัม",
  "มิลลิลิตร",
  "ลิตร",
  "ช้อนโต๊ะ",
  "ช้อนชา",
  "ถ้วย",
  "ฟอง",
  "หัว",
  "กิ่ง",
  "ใบ",
  "แผ่น",
  "ซอง",
  "ขวด",
  "อื่นๆ",
];

export default function IngredientFormModal({
  isOpen,
  onClose,
  onSuccess,
  ingredient,
}: IngredientFormModalProps) {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    ingredient_name: "",
    unit_of_measure: "กรัม",
    is_available: true,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (ingredient) {
      setFormData({
        ingredient_name: ingredient.ingredient_name,
        unit_of_measure: ingredient.unit_of_measure,
        is_available: ingredient.is_available,
      });
    } else {
      setFormData({
        ingredient_name: "",
        unit_of_measure: "กรัม",
        is_available: true,
      });
    }
    setErrors({});
  }, [ingredient, isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Client-side validation
    const validation = validateIngredient(formData, !!ingredient);
    if (!validation.isValid) {
      const errorMap: Record<string, string> = {};
      validation.errors.forEach((error) => {
        errorMap[error.field] = error.message;
      });
      setErrors(errorMap);
      return;
    }

    setLoading(true);
    setErrors({});
    
    try {
      const url = ingredient
        ? `/api/ingredients/${ingredient.ingredient_id}`
        : '/api/ingredients';
      
      const method = ingredient ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (!result.success) {
        // Handle API validation errors
        if (result.errors) {
          const errorMap: Record<string, string> = {};
          result.errors.forEach((error: { field: string; message: string }) => {
            errorMap[error.field] = error.message;
          });
          setErrors(errorMap);
        }
        toast.error(result.error || 'เกิดข้อผิดพลาด');
        return;
      }

      toast.success(ingredient ? "แก้ไขวัตถุดิบสำเร็จ" : "เพิ่มวัตถุดิบสำเร็จ");
      onSuccess();
      onClose();
    } catch (error) {
      console.log("Error saving ingredient:", error);
      toast.error("เกิดข้อผิดพลาด");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={ingredient ? "แก้ไขวัตถุดิบ" : "เพิ่มวัตถุดิบ"}
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            ชื่อวัตถุดิบ
          </label>
          <input
            type="text"
            value={formData.ingredient_name}
            onChange={(e) => {
              setFormData({ ...formData, ingredient_name: e.target.value });
              setErrors({ ...errors, ingredient_name: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.ingredient_name ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
            }`}
            placeholder="กรอกชื่อวัตถุดิบ"
          />
          <ErrorLabel message={errors.ingredient_name} />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            หน่วย
          </label>
          <select
            value={formData.unit_of_measure}
            onChange={(e) => {
              setFormData({ ...formData, unit_of_measure: e.target.value });
              setErrors({ ...errors, unit_of_measure: '' });
            }}
            className={`w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 ${
              errors.unit_of_measure ? 'border-red-500 focus:ring-red-500' : 'border-gray-300 focus:ring-black'
            }`}
          >
            {UNITS.map((unit) => (
              <option key={unit} value={unit}>
                {unit}
              </option>
            ))}
          </select>
          <ErrorLabel message={errors.unit_of_measure} />
        </div>

        {ingredient && (
          <div className="flex items-center justify-between py-2">
            <span className="text-sm font-semibold text-gray-700">
              สถานะ
            </span>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={!!formData.is_available}
                onChange={(e) =>
                  setFormData({ ...formData, is_available: e.target.checked })
                }
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
              <span className="ml-3 text-sm font-medium text-gray-700">
                {formData.is_available ? "เปิดใช้งาน" : "ปิดใช้งาน"}
              </span>
            </label>
          </div>
        )}

        <div className="flex gap-3 pt-4">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors"
            disabled={loading}
          >
            ยกเลิก
          </button>
          <button
            type="submit"
            disabled={loading}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "กำลังบันทึก..." : ingredient ? "บันทึก" : "เพิ่ม"}
          </button>
        </div>
      </form>
    </Modal>
  );
}
