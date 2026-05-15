export interface Notification {
  notif_id: string;
  user_id: string;
  type: string;
  message: string;
  scheduled_at: string;
  is_sent: boolean;
  is_read: boolean;
  created_date: string;
}
