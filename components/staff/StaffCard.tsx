"use client";

import { Edit2, Trash2 } from "lucide-react";
import Image from "next/image";
import type { Staff } from "@/lib/hooks/useStaff";

interface StaffCardProps {
  staff: Staff;
  onEdit: (staff: Staff) => void;
  onDelete: (staff: Staff) => void;
}

export default function StaffCard({ staff, onEdit, onDelete }: StaffCardProps) {
  return (
    <div className="p-4 border-b bg-white border-gray-200">
      <div className="flex items-start gap-4">
        <div className="relative w-12 h-12 rounded-full overflow-hidden bg-gray-200 flex-shrink-0">
          {staff.profile_image_url ? (
            <Image
              src={staff.profile_image_url}
              alt={staff.name}
              fill
              className="object-cover"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-2xl font-bold text-gray-400">
              {staff.name.charAt(0).toUpperCase()}
            </div>
          )}
        </div>

        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-gray-900">{staff.name}</h3>
          <p className="text-sm text-gray-600">{staff.email}</p>
          <p className="text-sm text-gray-600">{staff.phone_number}</p>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => onEdit(staff)}
            className="p-2 hover:bg-gray-100 rounded-full transition-colors"
          >
            <Edit2 size={18} className="text-gray-600" />
          </button>
          <button
            onClick={() => onDelete(staff)}
            className="p-2 hover:bg-red-50 rounded-full transition-colors"
          >
            <Trash2 size={18} className="text-red-500" />
          </button>
        </div>
      </div>
    </div>
  );
}
