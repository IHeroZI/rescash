"use client";

import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";

export interface Notification {
  noti_id: number;
  user_id: number;
  order_id: number | null;
  message: string;
  create_datetime: string;
  is_read: boolean;
}

export function useNotifications(userId?: number) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  const fetchNotifications = async () => {
    if (!userId) {
      console.log("[useNotifications] No userId provided");
      setLoading(false);
      return;
    }

    console.log("[useNotifications] Fetching notifications for userId:", userId);
    setLoading(true);
    const { data, error } = await supabase
      .from("notification")
      .select("*")
      .eq("user_id", userId)
      .order("create_datetime", { ascending: false });

    if (error) {
      console.log("[useNotifications] Error fetching notifications:", error);
    } else {
      console.log(`[useNotifications] Found ${data?.length || 0} notifications for user ${userId}:`, data);
      setNotifications(data || []);
      setUnreadCount((data || []).filter((n) => !n.is_read).length);
    }
    setLoading(false);
  };

  const markAsRead = async (notiId: number) => {
    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("noti_id", notiId);

    if (error) {
      console.log("Error marking notification as read:", error);
    } else {
      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.noti_id === notiId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    const { error } = await supabase
      .from("notification")
      .update({ is_read: true })
      .eq("user_id", userId)
      .eq("is_read", false);

    if (error) {
      console.log("Error marking all notifications as read:", error);
    } else {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    }
  };

  useEffect(() => {
    if (!userId) {
      setLoading(false);
      return;
    }

    fetchNotifications();

    // Subscribe to real-time updates
    const channel = supabase
      .channel("notification-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "notification",
          filter: `user_id=eq.${userId}`,
        },
        () => {
          fetchNotifications();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  return {
    notifications,
    unreadCount,
    loading,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  };
}
