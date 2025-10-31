"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/hooks/useNotifications";
import Header from "@/components/common/Header";
import { Bell, Check, CheckCheck } from "lucide-react";
import { useRouter } from "next/navigation";
import { parseThailandDate, formatThailandDate } from "@/lib/utils/dateUtils";

export default function NotificationPage() {
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      
      console.log("[NotificationPage] Auth user:", authUser?.email);
      
      if (authUser?.email) {
        // Get the internal user_id from the user table using email via API
        const response = await fetch(`/api/users?email=${encodeURIComponent(authUser.email)}`);
        const result = await response.json();
        
        if (!response.ok) {
          console.log("[NotificationPage] Error fetching user_id:", result.error);
        } else if (result.success && result.data.length > 0) {
          const userData = result.data[0];
          console.log("[NotificationPage] User data:", userData);
          setUserId(userData.user_id);
        }
      }
    };
    fetchUser();
  }, [supabase]);

  const { notifications, loading, markAsRead, markAllAsRead } = useNotifications(userId || undefined);

  console.log("[NotificationPage] Current state:", {
    userId,
    notificationCount: notifications.length,
    loading
  });

  if (loading) {
    return (
      <div className="flex flex-col h-screen bg-white">
        <Header title="การแจ้งเตือน" backHref="/more" showNotificationIcon={false} />
        <div className="flex-1 flex items-center justify-center">
          <div className="text-gray-600">กำลังโหลด...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen bg-white">
      <Header title="การแจ้งเตือน" backHref="/more" showNotificationIcon={false} />
      
      <div className="flex-1 overflow-y-auto scrollbar-hide p-4">
        {/* Header Actions */}
        <div className="mb-4">
          <div className="flex items-center justify-between">
            <p className="text-sm text-gray-600">
              {notifications.filter((n) => !n.is_read).length} รายการที่ยังไม่ได้อ่าน
            </p>
            {notifications.length > 0 && notifications.some((n) => !n.is_read) && (
              <button
                onClick={markAllAsRead}
                className="text-sm text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
              >
                <CheckCheck size={16} />
                อ่านทั้งหมด
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        <div className="bg-white rounded-lg border overflow-hidden">
          {notifications.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <Bell size={48} className="mx-auto mb-3 text-gray-300" />
              <p>ไม่มีการแจ้งเตือน</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {notifications.map((notification) => (
                <div
                  key={notification.noti_id}
                  onClick={() => {
                    if (!notification.is_read) {
                      markAsRead(notification.noti_id);
                    }
                    if (notification.order_id) {
                      router.push(`/order/${notification.order_id}`);
                    }
                  }}
                  className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                    !notification.is_read ? "bg-blue-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div
                      className={`flex-shrink-0 mt-1 ${
                        !notification.is_read ? "text-blue-600" : "text-gray-400"
                      }`}
                    >
                      <Bell size={20} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className={`text-sm ${
                          !notification.is_read ? "font-semibold text-gray-900" : "text-gray-700"
                        }`}
                      >
                        {notification.message}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatThailandDate(parseThailandDate(notification.create_datetime), {
                          year: "numeric",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                    {!notification.is_read && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          markAsRead(notification.noti_id);
                        }}
                        className="flex-shrink-0 p-1 text-blue-600 hover:text-blue-800"
                        title="ทำเครื่องหมายว่าอ่านแล้ว"
                      >
                        <Check size={18} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
