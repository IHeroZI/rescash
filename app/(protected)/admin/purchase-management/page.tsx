"use client";

import { useState } from "react";
import Header from "@/components/common/Header";
import SearchBar from "@/components/common/SearchBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import PurchaseCard from "@/components/purchase/PurchaseCard";
import PurchaseFormModal from "@/components/purchase/PurchaseFormModal";
import PurchaseDetailModal from "@/components/purchase/PurchaseDetailModal";
import { usePurchases } from "@/lib/hooks/usePurchases";
import type { Purchase } from "@/lib/hooks/usePurchases";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

type FilterType = "all" | "active";

export default function PurchaseManagementPage() {
  const { purchases, loading, refetch } = usePurchases();
  const [searchQuery, setSearchQuery] = useState("");
  const [filter, setFilter] = useState<FilterType>("active");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingPurchase, setEditingPurchase] = useState<Purchase | null>(null);
  const [selectedPurchase, setSelectedPurchase] = useState<Purchase | null>(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState<Purchase | null>(null);

  // Filter purchases
  const filteredPurchases = purchases.filter((purchase) => {
    const matchesSearch =
      purchase.purchase_id.toString().includes(searchQuery) ||
      (purchase.notes && purchase.notes.toLowerCase().includes(searchQuery.toLowerCase()));
    
    const matchesFilter =
      filter === "all" ? true : !purchase.is_deleted;

    return matchesSearch && matchesFilter;
  });

  const handleViewDetail = (purchase: Purchase) => {
    setSelectedPurchase(purchase);
    setIsDetailModalOpen(true);
  };

  const handleEdit = (purchase: Purchase) => {
    setEditingPurchase(purchase);
    setIsFormModalOpen(true);
  };

  const handleCloseForm = () => {
    setIsFormModalOpen(false);
    setEditingPurchase(null);
  };

  const handleDelete = async (purchase: Purchase) => {
    try {
      const response = await fetch(`/api/purchases/${purchase.purchase_id}`, {
        method: 'DELETE',
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to delete purchase');
      }

      toast.success("ลบการสั่งซื้อสำเร็จ");
      refetch();
    } catch (error) {
      console.log("Error deleting purchase:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="จัดการรายจ่าย" 
      backHref="/more"/>
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-hide">
        <div className="flex items-center justify-between">
          
          
        </div>

        <SearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          placeholder="ค้นหาด้วยรหัสหรือหมายเหตุ..."
        />

        <div className="flex gap-2">
          <button
            onClick={() => setFilter("active")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "active"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-white"
            }`}
          >
            ที่ใช้งาน
          </button>
          <button
            onClick={() => setFilter("all")}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              filter === "all"
                ? "bg-gray-800 text-white"
                : "bg-white text-gray-700 border border-gray-300 hover:bg-white"
            }`}
          >
            ทั้งหมด
          </button>
          <button
            onClick={() => {
              setEditingPurchase(null);
              setIsFormModalOpen(true);
            }}
            className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Plus size={20} />
            <span>สร้างใหม่</span>
          </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        ) : filteredPurchases.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบข้อมูล</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
            {filteredPurchases.map((purchase) => (
              <PurchaseCard
                key={purchase.purchase_id}
                purchase={purchase}
                onViewDetail={handleViewDetail}
                onEdit={handleEdit}
                onDelete={(p) => setDeleteConfirm(p)}
              />
            ))}
          </div>
        )}
      </div>

      <PurchaseFormModal
        isOpen={isFormModalOpen}
        onClose={handleCloseForm}
        onSuccess={() => {
          refetch();
          handleCloseForm();
        }}
        purchaseId={editingPurchase?.purchase_id}
        mode={editingPurchase ? "edit" : "create"}
      />

      {selectedPurchase && (
        <PurchaseDetailModal
          isOpen={isDetailModalOpen}
          onClose={() => {
            setIsDetailModalOpen(false);
            setSelectedPurchase(null);
          }}
          purchaseId={selectedPurchase.purchase_id}
          onEdit={(purchaseId) => {
            const purchase = purchases.find(p => p.purchase_id === purchaseId);
            if (purchase) handleEdit(purchase);
          }}
        />
      )}

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
          title="ยืนยันการลบ"
          message={`คุณต้องการลบการสั่งซื้อ #${deleteConfirm.purchase_id} ใช่หรือไม่?`}
          confirmText="ลบ"
          confirmColor="bg-red-500 hover:bg-red-600"
        />
      )}
    </div>
  );
}
