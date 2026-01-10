import { useCallback, useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { useUser } from '@/src/contexts/UserContext';
import { NotificationItem } from '@/src/types/notification.types';

export const useNotifications = () => {
  const { me } = useUser();
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchNotifications = useCallback(async () => {
    if (!me?.user_id) return;

    try {
      const { data, error } = await supabase
        .from('app_user_notifications_view')
        .select('*')
        .order('sent_at', { ascending: false });

      if (error) throw error;
      setNotifications(data as NotificationItem[]);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [me?.user_id]);

  const markAsRead = async (notificationId: string) => {
    if (!me?.user_id) return;

    setNotifications((prev) =>
      prev.map((n) =>
        n.id === notificationId ? { ...n, is_read: true, read_at: new Date().toISOString() } : n,
      ),
    );

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .match({ notification_id: notificationId, user_id: me.user_id });

      if (error) throw error;
    } catch (error) {
      console.error(error);
      fetchNotifications();
    }
  };

  const markAllAsRead = async () => {
    if (!me?.user_id) return;

    const unreadIds = notifications.filter((n) => !n.is_read).map((n) => n.id);
    if (unreadIds.length === 0) return;

    setNotifications((prev) =>
      prev.map((n) => ({ ...n, is_read: true, read_at: new Date().toISOString() })),
    );

    try {
      const { error } = await supabase
        .from('user_notifications')
        .update({ read_at: new Date().toISOString() })
        .in('notification_id', unreadIds)
        .eq('user_id', me.user_id);

      if (error) throw error;
    } catch (error) {
      console.error(error);
      fetchNotifications();
    }
  };

  const refresh = () => {
    setRefreshing(true);
    fetchNotifications();
  };

  return {
    notifications,
    loading,
    refreshing,
    refresh,
    fetchNotifications,
    markAsRead,
    markAllAsRead,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  };
};
