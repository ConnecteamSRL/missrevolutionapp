export type NotificationItem = {
  id: string;
  title: string;
  description: string;
  sent_at: string;
  read_at: string | null;
  is_read: boolean;
  data: NotificationData;
};

export interface NotificationData {
  route: string;
}
