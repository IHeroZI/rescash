"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Plus, X } from "lucide-react";
import { usePurchaseStore } from "@/lib/store/purchaseStore";
import { useIngredients } from "@/lib/hooks/useIngredients";
import toast from "react-hot-toast";

interface PurchaseFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  purchaseId?: number;
  mode?: "create" | "edit";
}

export default function PurchaseFormModal({
  isOpen,
  onClose,
  onSuccess,
  purchaseId,
  mode = "create",
}: PurchaseFormModalProps) {
  const { items, addItem, updateItem, removeItem, clearItems, getTotalAmount } = usePurchaseStore();
  const { ingredients } = useIngredients();
  const [notes, setNotes] = useState("");
  const [purchaseDate, setPurchaseDate] = useState<string>(new Date().toISOString());
  const [saving, setSaving] = useState(false);

  // Current item being added
  const [selectedIngredientId, setSelectedIngredientId] = useState<number | "">("");
  const [quantity, setQuantity] = useState("");
  const [unitCost, setUnitCost] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);

  // For editing existing items
  const [editingItemId, setEditingItemId] = useState<number | null>(null);
  const [editQuantity, setEditQuantity] = useState("");
  const [editUnitCost, setEditUnitCost] = useState("");

  const availableIngredients = ingredients.filter((ing) => ing.is_available);
  const filteredIngredients = availableIngredients.filter((ing) =>
    ing.ingredient_name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const selectedIngredient = availableIngredients.find(
    (ing) => ing.ingredient_id === selectedIngredientId
  );

  const loadPurchaseData = async () => {
    if (!purchaseId) return;

    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Fetch purchase info
      const { data: purchaseData } = await supabase
        .from("purchase")
        .select("*")
        .eq("purchase_id", purchaseId)
        .single();

      if (purchaseData) {
        setNotes(purchaseData.notes || "");
        setPurchaseDate(purchaseData.purchase_datetime);
      }

      // Fetch purchase items
      const { data: itemsData } = await supabase
        .from("purchaseIngredient")
        .select(`
          quantity_purchased,
          unit_cost,
          ingredient:ingredient_id (
            ingredient_id,
            ingredient_name,
            unit_of_measure
          )
        `)
        .eq("purchase_id", purchaseId);

      if (itemsData) {
        clearItems();
        itemsData.forEach((item) => {
          const ing = Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient;
          addItem({
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            unit_of_measure: ing.unit_of_measure,
            quantity: item.quantity_purchased,
            unit_cost: item.unit_cost,
          });
        });
      }
    } catch (error) {
      console.log("Error loading purchase data:", error);
      toast.error("เกิดข้อผิดพลาดในการโหลดข้อมูล");
    }
  };

  useEffect(() => {
    if (!isOpen) {
      // Reset form when modal closes
      clearItems();
      setNotes("");
      setPurchaseDate(new Date().toISOString());
      setSelectedIngredientId("");
      setQuantity("");
      setUnitCost("");
      setSearchQuery("");
      setEditingItemId(null);
    } else if (isOpen && mode === "edit" && purchaseId) {
      // Load existing purchase data
      loadPurchaseData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, mode, purchaseId]);

  const handleAddItem = () => {
    if (!selectedIngredient) {
      toast.error("กรุณาเลือกวัตถุดิบ");
      return;
    }
    if (!quantity || parseFloat(quantity) <= 0) {
      toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
      return;
    }
    if (!unitCost || parseFloat(unitCost) <= 0) {
      toast.error("กรุณาระบุราคาต่อหน่วยที่ถูกต้อง");
      return;
    }

    const existingItem = items.find(
      (item) => item.ingredient_id === selectedIngredient.ingredient_id
    );

    if (existingItem) {
      updateItem(
        selectedIngredient.ingredient_id,
        parseFloat(quantity),
        parseFloat(unitCost)
      );
      toast.success("อัปเดตรายการแล้ว");
    } else {
      addItem({
        ingredient_id: selectedIngredient.ingredient_id,
        ingredient_name: selectedIngredient.ingredient_name,
        unit_of_measure: selectedIngredient.unit_of_measure,
        quantity: parseFloat(quantity),
        unit_cost: parseFloat(unitCost),
      });
      toast.success("เพิ่มรายการแล้ว");
    }

    // Reset input fields
    setSelectedIngredientId("");
    setQuantity("");
    setUnitCost("");
    setSearchQuery("");
    setShowSuggestions(false);
  };

  const handleSave = async () => {
    if (items.length === 0) {
      toast.error("กรุณาเพิ่มรายการวัตถุดิบอย่างน้อย 1 รายการ");
      return;
    }

    try {
      setSaving(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const totalAmount = getTotalAmount();

      if (mode === "edit" && purchaseId) {
        // Update existing purchase
        const { error: updateError } = await supabase
          .from("purchase")
          .update({
            total_amount: totalAmount,
            notes: notes.trim() || null,
            purchase_datetime: purchaseDate,
          })
          .eq("purchase_id", purchaseId);

        if (updateError) throw updateError;

        // Delete old purchase items
        const { error: deleteError } = await supabase
          .from("purchaseIngredient")
          .delete()
          .eq("purchase_id", purchaseId);

        if (deleteError) throw deleteError;

        // Insert new purchase items
        const purchaseItems = items.map((item) => ({
          purchase_id: purchaseId,
          ingredient_id: item.ingredient_id,
          quantity_purchased: item.quantity,
          unit_cost: item.unit_cost,
        }));

        const { error: itemsError } = await supabase
          .from("purchaseIngredient")
          .insert(purchaseItems);

        if (itemsError) throw itemsError;

        toast.success("แก้ไขบันทึกรายจ่ายสำเร็จ");
      } else {
        // Create new purchase
        const { data: purchaseData, error: purchaseError } = await supabase
          .from("purchase")
          .insert({
            total_amount: totalAmount,
            notes: notes.trim() || null,
            purchase_datetime: purchaseDate,
          })
          .select()
          .single();

        if (purchaseError) throw purchaseError;

        // Insert purchase items
        const purchaseItems = items.map((item) => ({
          purchase_id: purchaseData.purchase_id,
          ingredient_id: item.ingredient_id,
          quantity_purchased: item.quantity,
          unit_cost: item.unit_cost,
        }));

        const { error: itemsError } = await supabase
          .from("purchaseIngredient")
          .insert(purchaseItems);

        if (itemsError) throw itemsError;

        toast.success("บันทึกการสั่งซื้อสำเร็จ");
      }

      onSuccess();
      onClose();
    } catch (error) {
      console.log("Error saving purchase:", error);
      toast.error("เกิดข้อผิดพลาดในการบันทึก");
    } finally {
      setSaving(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={mode === "edit" ? "แก้ไขบันทึกรายจ่าย" : "สร้างบันทึกรายจ่ายใหม่"}>
      <div className="space-y-6">
        {/* Date picker */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            วันที่ซื้อ
          </label>
          <input
            type="datetime-local"
            value={purchaseDate.slice(0, 16)}
            onChange={(e) => setPurchaseDate(new Date(e.target.value).toISOString())}
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
          />
        </div>

        {/* Add item section */}
        <div className="border rounded-lg p-4 space-y-3">
          <h3 className="font-semibold text-gray-900">เพิ่มรายการวัตถุดิบ</h3>

          {/* Ingredient search/select */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              เลือกวัตถุดิบ
            </label>
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

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                จำนวน
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
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                ราคา/หน่วย (฿)
              </label>
              <input
                type="number"
                value={unitCost}
                onChange={(e) => setUnitCost(e.target.value)}
                placeholder="0.00"
                step="0.01"
                min="0"
                className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent"
              />
            </div>
          </div>

          <button
            onClick={handleAddItem}
            className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={18} />
            <span>เพิ่มรายการ</span>
          </button>
        </div>

        {/* Items list */}
        {items.length > 0 && (
          <div className="border rounded-lg p-4 space-y-2">
            <h3 className="font-semibold text-gray-900 mb-3">รายการที่เลือก</h3>
            {items.map((item) => (
              <div
                key={item.ingredient_id}
                className="p-3 bg-white rounded-lg"
              >
                {editingItemId === item.ingredient_id ? (
                  // Edit mode
                  <div className="space-y-2">
                    <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                    <div className="grid grid-cols-2 gap-2">
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
                      <div>
                        <label className="text-xs text-gray-600">ราคา/หน่วย (฿)</label>
                        <input
                          type="number"
                          value={editUnitCost}
                          onChange={(e) => setEditUnitCost(e.target.value)}
                          className="w-full px-2 py-1 text-sm border rounded focus:ring-2 focus:ring-gray-800 focus:border-transparent"
                          step="0.01"
                          min="0"
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={() => {
                          if (!editQuantity || parseFloat(editQuantity) <= 0) {
                            toast.error("กรุณาระบุจำนวนที่ถูกต้อง");
                            return;
                          }
                          if (!editUnitCost || parseFloat(editUnitCost) <= 0) {
                            toast.error("กรุณาระบุราคาที่ถูกต้อง");
                            return;
                          }
                          updateItem(item.ingredient_id, parseFloat(editQuantity), parseFloat(editUnitCost));
                          setEditingItemId(null);
                          toast.success("อัปเดตรายการแล้ว");
                        }}
                        className="flex-1 px-3 py-1 text-sm bg-gray-800 text-white rounded hover:bg-gray-700 transition-colors"
                      >
                        บันทึก
                      </button>
                      <button
                        onClick={() => setEditingItemId(null)}
                        className="flex-1 px-3 py-1 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition-colors"
                      >
                        ยกเลิก
                      </button>
                    </div>
                  </div>
                ) : (
                  // View mode
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit_of_measure} × ฿
                        {item.unit_cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-900">
                        ฿
                        {(item.quantity * item.unit_cost).toLocaleString("th-TH", {
                          minimumFractionDigits: 2,
                        })}
                      </p>
                      <button
                        onClick={() => {
                          setEditingItemId(item.ingredient_id);
                          setEditQuantity(item.quantity.toString());
                          setEditUnitCost(item.unit_cost.toString());
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
                        onClick={() => removeItem(item.ingredient_id)}
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
            <div className="border-t pt-3 mt-3">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-gray-900">ยอดรวม</p>
                <p className="text-xl font-bold text-blue-600">
                  ฿{getTotalAmount().toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Notes */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            หมายเหตุ (ถ้ามี)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="ระบุหมายเหตุเพิ่มเติม..."
            className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-gray-800 focus:border-transparent resize-none"
          />
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={onClose}
            disabled={saving}
            className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
          >
            ยกเลิก
          </button>
          <button
            onClick={handleSave}
            disabled={saving || items.length === 0}
            className="flex-1 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {saving ? "กำลังบันทึก..." : "บันทึก"}
          </button>
        </div>
      </div>
    </Modal>
  );
}
