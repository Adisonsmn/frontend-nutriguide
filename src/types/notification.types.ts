export interface Notification {
  notif_id: string;
  user_id: string;
  type: string;
  message: string;
  scheduled_at: string;
  is_sent: boolean;
  created_date: string;
}
