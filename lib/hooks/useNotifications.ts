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
    
    try {
      const response = await fetch(`/api/notifications?user_id=${userId}`);
      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to fetch notifications');
      }

      const data = result.data || [];
      console.log(`[useNotifications] Found ${data.length} notifications for user ${userId}:`, data);
      setNotifications(data);
      setUnreadCount(data.filter((n: Notification) => !n.is_read).length);
    } catch (error) {
      console.log("[useNotifications] Error fetching notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (notiId: number) => {
    try {
      const response = await fetch(`/api/notifications/${notiId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ is_read: true }),
      });

      const result = await response.json();

      if (!result.success) {
        throw new Error(result.error || 'Failed to mark notification as read');
      }

      // Update local state
      setNotifications((prev) =>
        prev.map((n) => (n.noti_id === notiId ? { ...n, is_read: true } : n))
      );
      setUnreadCount((prev) => Math.max(0, prev - 1));
    } catch (error) {
      console.log("Error marking notification as read:", error);
    }
  };

  const markAllAsRead = async () => {
    if (!userId) return;

    try {
      // Mark all unread notifications as read
      const unreadNotifications = notifications.filter((n) => !n.is_read);
      
      await Promise.all(
        unreadNotifications.map((n) =>
          fetch(`/api/notifications/${n.noti_id}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify({ is_read: true }),
          })
        )
      );

      // Update local state
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      setUnreadCount(0);
    } catch (error) {
      console.log("Error marking all notifications as read:", error);
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
