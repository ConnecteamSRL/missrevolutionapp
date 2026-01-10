export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  sent_at: string;
  read_at: string | null;
  is_read: boolean;
  data: Record<string, any>;
};
