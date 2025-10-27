"use client";

import { useState } from "react";
import Header from "@/components/common/Header";
import SearchBar from "@/components/common/SearchBar";
import ConfirmDialog from "@/components/common/ConfirmDialog";
import StaffCard from "@/components/staff/StaffCard";
import StaffFormModal from "@/components/staff/StaffFormModal";
import { useStaff } from "@/lib/hooks/useStaff";
import type { Staff } from "@/lib/hooks/useStaff";
import { Plus } from "lucide-react";
import toast from "react-hot-toast";

export default function StaffManagementPage() {
  const { staff, loading, refetch } = useStaff();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<Staff | null>(null);

  // Filter staff
  const filteredStaff = staff.filter((s) => {
    const searchLower = searchQuery.toLowerCase();
    return (
      s.name.toLowerCase().includes(searchLower) ||
      s.email.toLowerCase().includes(searchLower) ||
      (s.phone_number && s.phone_number.includes(searchQuery))
    );
  });

  const handleEdit = (staff: Staff) => {
    setSelectedStaff(staff);
    setIsFormModalOpen(true);
  };

  const handleAdd = () => {
    setSelectedStaff(null);
    setIsFormModalOpen(true);
  };

  const handleDelete = async (staff: Staff) => {
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();

      const { error } = await supabase
        .from("users")
        .update({ role: "customer" })
        .eq("user_id", staff.user_id);

      if (error) throw error;

      toast.success("ลบพนักงานสำเร็จ");
      refetch();
    } catch (error) {
      console.log("Error deleting staff:", error);
      toast.error("เกิดข้อผิดพลาดในการลบ");
    } finally {
      setDeleteConfirm(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="จัดการพนักงาน" 
      backHref="/more"
      />
      <div className="flex-1 flex flex-col p-4 space-y-4 overflow-y-auto scrollbar-hide">
        
        <div className="flex gap-2 mb-4">
        <div className="flex-1">
          <SearchBar
            value={searchQuery}
            onChange={setSearchQuery}
            placeholder="ค้นหาด้วยชื่อ หรืออีเมล"
          />
        </div>
        <button
          onClick={handleAdd}
          className="flex items-center justify-center bg-gray-800 text-white rounded-full hover:bg-[#399586] transition-colors w-10 h-10"
        >
          <Plus size={20} />
        </button>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <p className="text-gray-500">กำลังโหลด...</p>
          </div>
        ) : filteredStaff.length === 0 ? (
          <div className="text-center py-8">
            <p className="text-gray-500">ไม่พบข้อมูล</p>
          </div>
        ) : (
          <div className="flex-1 space-y-3 overflow-y-auto scrollbar-hide">
            {filteredStaff.map((s) => (
              <StaffCard
                key={s.user_id}
                staff={s}
                onEdit={handleEdit}
                onDelete={(s) => setDeleteConfirm(s)}
              />
            ))}
          </div>
        )}
      </div>

      <StaffFormModal
        isOpen={isFormModalOpen}
        onClose={() => {
          setIsFormModalOpen(false);
          setSelectedStaff(null);
        }}
        onSuccess={refetch}
        staff={selectedStaff}
      />

      {deleteConfirm && (
        <ConfirmDialog
          isOpen={true}
          onClose={() => setDeleteConfirm(null)}
          onConfirm={() => handleDelete(deleteConfirm)}
          title="ยืนยันการลบ"
          message={`คุณต้องการลบพนักงาน "${deleteConfirm.name}" ใช่หรือไม่?`}
          confirmText="ลบ"
          confirmColor="bg-red-500 hover:bg-red-600"
        />
      )}
    </div>
  );
}
