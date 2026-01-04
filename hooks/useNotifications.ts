import { useState, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useAuth } from "./useAuth";

export interface Notification {
  id: string;
  type: "comment" | "user" | "system" | "newsletter";
  message: string;
  link: string;
  isRead: boolean;
  createdAt: string;
}

export const useNotifications = () => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;

    // 1. Fetch initial unread notifications
    const fetchNotifications = async () => {
      try {
        const { data, error } = await supabase
          .schema("blog")
          .from("notifications")
          .select("*")
          .eq("is_read", false)
          .order("created_at", { ascending: false })
          .limit(20);

        if (error) throw error;

        // Map snake_case to camelCase
        const formatted: Notification[] = data.map((n: any) => ({
          id: n.id,
          type: n.type,
          message: n.message,
          link: n.link,
          isRead: n.is_read,
          createdAt: n.created_at,
        }));

        setNotifications(formatted);
      } catch (err) {
        console.error("Error fetching notifications:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchNotifications();

    // 2. Subscribe to Realtime updates
    const subscription = supabase
      .channel("admin_notifications")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "blog",
          table: "notifications",
        },
        (payload) => {
          const newNotif = payload.new as any;
          const formattedNotif: Notification = {
            id: newNotif.id,
            type: newNotif.type,
            message: newNotif.message,
            link: newNotif.link,
            isRead: newNotif.is_read,
            createdAt: newNotif.created_at,
          };
          setNotifications((prev) => [formattedNotif, ...prev]);

          // Optional: Play a sound or show a browser notification here
        }
      )
      .subscribe();

    return () => {
      subscription.unsubscribe();
    };
  }, [user]);

  const markAsRead = async (id: string) => {
    // Optimistic update
    setNotifications((prev) => prev.filter((n) => n.id !== id));

    try {
      await supabase
        .schema("blog")
        .from("notifications")
        .update({ is_read: true })
        .eq("id", id);
    } catch (err) {
      console.error("Error marking notification as read:", err);
    }
  };

  const markAllAsRead = async () => {
    setNotifications([]);
    try {
      await supabase
        .schema("blog")
        .from("notifications")
        .update({ is_read: true })
        .eq("is_read", false);
    } catch (err) {
      console.error("Error marking all as read:", err);
    }
  };

  return {
    notifications,
    loading,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications.length,
  };
};
