"use client";

import { useState, useEffect } from "react";
import Modal from "@/components/common/Modal";
import { Edit2 } from "lucide-react";

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
  onEdit?: (purchaseId: number) => void;
}

export default function PurchaseDetailModal({
  isOpen,
  onClose,
  purchaseId,
  onEdit,
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

      // Fetch purchase details via API
      const response = await fetch(`/api/purchases/${purchaseId}`);
      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || 'Failed to fetch purchase details');
      }

      const purchaseData = result.data;
      if (purchaseData) {
        setPurchaseInfo({
          total_amount: purchaseData.total_amount,
          notes: purchaseData.notes,
          purchase_datetime: purchaseData.purchase_datetime,
        });

        // Format items from API response
        if (purchaseData.items && Array.isArray(purchaseData.items)) {
          const formattedItems = purchaseData.items.map((item: {
            ingredient_id: number;
            ingredient_name: string;
            unit_of_measure: string;
            quantity_purchased: number;
            unit_cost: string;
          }) => ({
            ingredient_id: item.ingredient_id,
            ingredient_name: item.ingredient_name,
            unit_of_measure: item.unit_of_measure,
            quantity: item.quantity_purchased,
            unit_cost: parseFloat(item.unit_cost),
          }));
          setItems(formattedItems);
        }
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
    <Modal isOpen={isOpen} onClose={onClose} title={`รายละเอียดบันทึกรายจ่าย #${purchaseId}`}>
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
                    className="flex items-center justify-between p-3 bg-white rounded-lg"
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
                <p className="text-xl font-bold text-gray-800">
                  ฿{purchaseInfo.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
                </p>
              </div>
            </div>
          )}

          {onEdit && (
            <div className="border-t pt-4">
              <button
                onClick={() => {
                  onEdit(purchaseId);
                  onClose();
                }}
                className="w-full flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
              >
                <Edit2 size={18} />
                <span>แก้ไขบันทึกรายจ่าย</span>
              </button>
            </div>
          )}
        </div>
      )}
    </Modal>
  );
}
