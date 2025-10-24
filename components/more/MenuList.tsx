"use client";

import { Edit, Lock, LogOut, Receipt, Users, Apple, BarChart3 } from "lucide-react";
import Link from "next/link";
import { signOut } from "@/app/auth/actions";

interface MenuItemProps {
  icon: React.ReactNode;
  label: string;
  href?: string;
  onClick?: () => void;
}

function MenuItem({ icon, label, href, onClick }: MenuItemProps) {
  const content = (
    <>
      <span className="text-gray-700">{icon}</span>
      <span className="text-gray-900">{label}</span>
    </>
  );

  if (href) {
    return (
      <Link
        href={href}
        className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg"
      >
        {content}
      </Link>
    );
  }

  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-3 px-4 py-3 hover:bg-gray-50 transition-colors rounded-lg"
    >
      {content}
    </button>
  );
}

export function CustomerStaffMenuList() {
  return (
    <div className="space-y-1">
      <MenuItem icon={<Edit size={20} />} label="แก้ไขโปรไฟล์" href="/profile/edit" />
      <MenuItem icon={<Lock size={20} />} label="เปลี่ยนรหัสผ่าน" href="/profile/change-password" />
      <form action={signOut}>
        <MenuItem
          icon={<LogOut size={20} />}
          label="ออกจากระบบ"
          onClick={() => {}}
        />
      </form>
    </div>
  );
}

export function AdminMenuList() {
  return (
    <div className="space-y-1">
      <MenuItem icon={<Users size={20} />} label="จัดการพนักงาน" href="/admin/staff-management" />
      <MenuItem icon={<Apple size={20} />} label="จัดการวัตถุดิบ" href="/admin/ingredient-management" />
      <MenuItem icon={<Receipt size={20} />} label="จัดการรายจ่าย" href="/admin/purchase-management" />
      <MenuItem icon={<BarChart3 size={20} />} label="Dashboard" href="/admin/dashboard" />
      <div className="border-t border-gray-300 pt-2">
      <MenuItem icon={<Edit size={20} />} label="แก้ไขโปรไฟล์" href="/profile/edit" />
      <MenuItem icon={<Lock size={20} />} label="เปลี่ยนรหัสผ่าน" href="/profile/change-password" />
      
      <form action={signOut}>
        <MenuItem
          icon={<LogOut size={20} />}
          label="ออกจากระบบ"
          onClick={() => {}}
        />
      </form>
      </div>
    </div>
  );
}
