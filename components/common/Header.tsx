"use client";

import { ChevronLeft, Bell } from "lucide-react";
import Link from "next/link";
import { type FC, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useNotifications } from "@/lib/hooks/useNotifications";
import { useRouter } from "next/navigation";

interface HeaderProps {
  title: string;
  showBackButton?: boolean;
  backHref?: string;
  showNotificationIcon?: boolean;
}

const Header: FC<HeaderProps> = ({
  title,
  showBackButton = true,
  backHref = "/",
  showNotificationIcon = true,
}) => {
  const [userId, setUserId] = useState<number | null>(null);
  const router = useRouter();
  const supabase = createClient();

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user: authUser },
      } = await supabase.auth.getUser();
      
      if (authUser?.email) {
        // Get the internal user_id from the user table using email via API
        const response = await fetch(`/api/users?email=${encodeURIComponent(authUser.email)}`);
        const result = await response.json();
        
        if (response.ok && result.success && result.data.length > 0) {
          setUserId(result.data[0].user_id);
        } else {
          console.log("Error fetching user_id in Header:", result.error);
        }
      }
    };
    fetchUser();
  }, [supabase]);

  const { unreadCount } = useNotifications(userId || undefined);

  return (
    <div className="relative flex w-full items-center justify-center p-4">
      {/* Back Button on the far left */}
      {showBackButton && (
        <div className="absolute left-4">
          <Link href={backHref} className="p-2">
            <ChevronLeft size={24} className="text-gray-800" />
          </Link>
        </div>
      )}

      {/* Title in the center */}
      <div className="flex-1 text-center">
        <h1 className="text-xl font-semibold text-gray-800">{title}</h1>
      </div>

      {/* Notification Icon on the far right */}
      {showNotificationIcon && (
        <div className="absolute right-4">
          <button
            onClick={() => router.push("/notification")}
            className="p-2 relative"
          >
            <Bell size={24} className="text-gray-800" />
            {unreadCount > 0 && (
              <span className="absolute top-0 right-0 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                {unreadCount > 9 ? "9+" : unreadCount}
              </span>
            )}
          </button>
        </div>
      )}
    </div>
  );
};

export default Header;