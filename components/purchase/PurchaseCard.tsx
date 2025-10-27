"use client";

import { Eye, Trash2, Edit2 } from "lucide-react";
import type { Purchase } from "@/lib/hooks/usePurchases";

interface PurchaseCardProps {
  purchase: Purchase;
  onViewDetail: (purchase: Purchase) => void;
  onEdit?: (purchase: Purchase) => void;
  onDelete: (purchase: Purchase) => void;
}

export default function PurchaseCard({ purchase, onViewDetail, onEdit, onDelete }: PurchaseCardProps) {
  const formattedDate = new Date(purchase.purchase_datetime).toLocaleDateString("th-TH", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });

  return (
    <div className="p-4 border rounded-lg bg-white border-gray-200">
      <div className="flex items-start justify-between mb-2">
        <div className="flex-1">
          <h3 className="font-semibold text-gray-900">
            รหัส #{purchase.purchase_id}
          </h3>
          <p className="text-sm text-gray-500">{formattedDate}</p>
        </div>
        <div className="text-right">
          <p className="text-lg font-bold text-gray-900">
            ฿{purchase.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>
        </div>
      </div>

      {purchase.notes && (
        <p className="text-sm text-gray-600 mb-3">หมายเหตุ: {purchase.notes}</p>
      )}

      <div className="flex gap-2">
        <button
          onClick={() => onViewDetail(purchase)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
        >
          <Eye size={18} />
          <span>ดูรายละเอียด</span>
        </button>
        {!purchase.is_deleted && onEdit && (
          <button
            onClick={() => onEdit(purchase)}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
            title="แก้ไข"
          >
            <Edit2 size={18} />
          </button>
        )}
        {!purchase.is_deleted && (
          <button
            onClick={() => onDelete(purchase)}
            className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
            title="ลบ"
          >
            <Trash2 size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
