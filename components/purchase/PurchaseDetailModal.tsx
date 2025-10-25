"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";

interface PurchaseItem {
  ingredient_id: number;
  ingredient_name: string;
  unit_of_measure: string;
  quantity: number;
  unit_cost: number;
}

interface PurchaseDetailModalProps {
  isOpen: boolean;
  onClose: () => void;
  purchaseId: number;
}

export default function PurchaseDetailModal({
  isOpen,
  onClose,
  purchaseId,
}: PurchaseDetailModalProps) {
  const [items, setItems] = useState<PurchaseItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [purchaseInfo, setPurchaseInfo] = useState<{
    total_amount: number;
    notes: string;
    purchase_datetime: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && purchaseId) {
      fetchPurchaseDetails();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, purchaseId]);

  const fetchPurchaseDetails = async () => {
    try {
      setLoading(true);
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      // Fetch purchase info
      const { data: purchaseData } = await supabase
        .from("purchase")
        .select("*")
        .eq("purchase_id", purchaseId)
        .single();

      if (purchaseData) {
        setPurchaseInfo(purchaseData);
      }

      // Fetch purchase items with ingredient details
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
        const formattedItems = itemsData.map((item) => {
          const ing = Array.isArray(item.ingredient) ? item.ingredient[0] : item.ingredient;
          return {
            ingredient_id: ing.ingredient_id,
            ingredient_name: ing.ingredient_name,
            unit_of_measure: ing.unit_of_measure,
            quantity: item.quantity_purchased,
            unit_cost: item.unit_cost,
          };
        });
        setItems(formattedItems);
      }
    } catch (error) {
      console.log("Error fetching purchase details:", error);
    } finally {
      setLoading(false);
    }
  };

  const formattedDate = purchaseInfo
    ? new Date(purchaseInfo.purchase_datetime).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : "";

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`รายละเอียดการสั่งซื้อ #${purchaseId}`}>
      {loading ? (
        <div className="text-center py-8">
          <p className="text-gray-500">กำลังโหลด...</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchaseInfo && (
            <div className="border-b pb-4">
              <p className="text-sm text-gray-600">วันที่สั่งซื้อ: {formattedDate}</p>
              {purchaseInfo.notes && (
                <p className="text-sm text-gray-600 mt-1">หมายเหตุ: {purchaseInfo.notes}</p>
              )}
            </div>
          )}

          <div className="space-y-2">
            <h3 className="font-semibold text-gray-900">รายการวัตถุดิบ</h3>
            {items.length === 0 ? (
              <p className="text-gray-500 text-sm">ไม่มีรายการ</p>
            ) : (
              <div className="space-y-2">
                {items.map((item) => (
                  <div
                    key={item.ingredient_id}
                    className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                  >
                    <div className="flex-1">
                      <p className="font-medium text-gray-900">{item.ingredient_name}</p>
                      <p className="text-sm text-gray-600">
                        {item.quantity} {item.unit_of_measure} × ฿{item.unit_cost.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ฿{(item.quantity * item.unit_cost).toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {purchaseInfo && (
            <div className="border-t pt-4">
              <div className="flex justify-between items-center">
                <p className="text-lg font-bold text-gray-900">ยอดรวม</p>
                <p className="text-xl font-bold text-blue-600">
                  ฿{purchaseInfo.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
