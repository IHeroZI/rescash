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

  // Red border for deleted purchases
  const borderClass = purchase.is_deleted ? "border-l-4 border-l-red-500" : "";

  return (
    <div className={`py-3 border-b border-gray-200 hover:bg-gray-50 transition-colors ${borderClass}`}>
      <div className="flex items-center justify-between gap-4">
        <div className="flex-1 min-w-0">
          <div className="flex items-baseline gap-2">
            <h3 className="font-semibold text-gray-900">
              รหัส #{purchase.purchase_id}
            </h3>
            {purchase.is_deleted && (
              <span className="text-xs text-red-600 font-medium">(ถูกลบ)</span>
            )}
          </div>
          <p className="text-sm text-gray-500">{formattedDate}</p>
          {purchase.notes && (
            <p className="text-sm text-gray-600 mt-1">หมายเหตุ: {purchase.notes}</p>
          )}
        </div>

        <div className="flex items-center gap-3">
          <p className="text-lg font-bold text-gray-900 whitespace-nowrap">
            ฿{purchase.total_amount.toLocaleString("th-TH", { minimumFractionDigits: 2 })}
          </p>

          <div className="flex gap-2">
            <button
              onClick={() => onViewDetail(purchase)}
              className="p-2 text-gray-600 hover:text-gray-900 hover:bg-gray-100 rounded-lg transition-colors"
              title="ดูรายละเอียด"
            >
              <Eye size={18} />
            </button>
            {!purchase.is_deleted && onEdit && (
              <button
                onClick={() => onEdit(purchase)}
                className="p-2 text-blue-600 hover:text-blue-900 hover:bg-blue-50 rounded-lg transition-colors"
                title="แก้ไข"
              >
                <Edit2 size={18} />
              </button>
            )}
            {!purchase.is_deleted && (
              <button
                onClick={() => onDelete(purchase)}
                className="p-2 text-red-600 hover:text-red-900 hover:bg-red-50 rounded-lg transition-colors"
                title="ลบ"
              >
                <Trash2 size={18} />
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
