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
      // Postgres non propaga il NOT NULL attraverso una vista, cosi' i tipi
      // generati danno tutte le colonne nullable e `data` come Json generico;
      // sulle tabelle di partenza id, title, body e data sono NOT NULL.
      // Il filtro sull'utente e' indispensabile: la RLS su user_notifications
      // concede a chi ha NOTIFICATION:READ:GYM di leggere anche le righe dei
      // clienti della propria palestra (serve al backoffice per lo stato di
      // consegna). Senza questo .eq(), un operator che apre l'app si vedrebbe
      // in casella le notifiche dei suoi clienti. La casella personale e'
      // personale: il confine lo mette la query, non la policy.
      const { data, error } = await supabase
        .from('app_user_notifications_view')
        .select('*')
        .eq('user_id', me.user_id)
        .order('sent_at', { ascending: false })
        .overrideTypes<NotificationItem[], { merge: false }>();

      if (error) throw error;
      setNotifications(data);
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

  const deleteNotification = async (notificationId: string) => {
    if (!me?.user_id) return;

    setNotifications((prev) => prev.filter((n) => n.id !== notificationId));

    try {
      // La RLS filtra le righe invece di sollevare un'eccezione: senza contare
      // quante ne ha cancellate, supabase-js torna error = null anche quando non
      // ha toccato niente e la notifica ricompare al primo aggiornamento. Zero
      // righe cancellate e' un fallimento, non un successo silenzioso.
      const { error, count } = await supabase
        .from('user_notifications')
        .delete({ count: 'exact' })
        .match({ notification_id: notificationId, user_id: me.user_id });

      if (error) throw error;
      if (!count) throw new Error('Nessuna notifica cancellata');
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
    deleteNotification,
    unreadCount: notifications.filter((n) => !n.is_read).length,
  };
};
