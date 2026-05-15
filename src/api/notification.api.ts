import api from './axiosInstance';
import type { ApiResponse } from '../types/api.types';
import type { Notification } from '../types/notification.types';

export const fetchNotifications = async () => {
  const response = await api.get<ApiResponse<Notification[]>>('/notifications');
  return response.data;
};

export const fetchUnreadCount = async () => {
  const response = await api.get<ApiResponse<{ count: number }>>('/notifications/unread-count');
  return response.data;
};

export const markNotificationAsRead = async (notifId: string) => {
  const response = await api.patch<ApiResponse<null>>(`/notifications/${notifId}/read`);
  return response.data;
};

export const markAllNotificationsAsRead = async () => {
  const response = await api.patch<ApiResponse<null>>('/notifications/read-all');
  return response.data;
};
