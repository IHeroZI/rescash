"use client";

import Header from "@/components/common/Header";
import ProfileCard from "@/components/common/ProfileCard";
import { CustomerStaffMenuList, AdminMenuList } from "@/components/more/MenuList";
import { useUser } from "@/lib/hooks/useUser";
import NavBar from "@/components/common/NavBar";

export default function MorePage() {
  const { userData, loading, error } = useUser();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-gray-600">กำลังโหลด...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-600 mb-4">เกิดข้อผิดพลาด: {error}</div>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          โหลดใหม่
        </button>
      </div>
    );
  }

  if (!userData) {
    return (
      <div className="flex flex-col items-center justify-center h-screen p-4">
        <div className="text-red-600 mb-4">ไม่พบข้อมูลผู้ใช้</div>
        <p className="text-sm text-gray-600 mb-4">กรุณาตรวจสอบว่าได้สร้างข้อมูลใน Users table แล้ว</p>
        <button 
          onClick={() => window.location.href = "/auth/login"}
          className="px-4 py-2 bg-black text-white rounded-lg"
        >
          กลับไปหน้า Login
        </button>
      </div>
    );
  }

  const isAdmin = userData.role === "admin";

  return (
    <div className="min-h-screen bg-white pb-20">
      <Header
        title={isAdmin ? "" : ""}
        backHref={isAdmin ? undefined : "/more"}
        showBackButton={false}
        showNotificationIcon={true}
      />

      <div className="p-4">
        <ProfileCard userData={userData} />

        <div className="mt-4">
          {isAdmin ? (
            <AdminMenuList />
          ) : (
            <CustomerStaffMenuList />
          )}
        </div>
      </div>

      <NavBar />
    </div>
  );
}
