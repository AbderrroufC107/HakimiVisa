import { api } from './api';
import type { Notification, NotificationsMeta } from '@/types';

interface NotificationsResponse {
  data: Notification[];
  meta: NotificationsMeta;
}

export const notificationsService = {
  findAll(page = 1, limit = 20, read?: boolean) {
    const params: Record<string, string> = { page: String(page), limit: String(limit) };
    if (read !== undefined) params.read = String(read);
    return api.get<NotificationsResponse>('/notifications', params);
  },

  getUnreadCount() {
    return api.get<number>('/notifications/unread-count');
  },

  markAsRead(id: string) {
    return api.patch<void>(`/notifications/${id}/read`);
  },

  markAllAsRead() {
    return api.patch<void>('/notifications/read-all');
  },

  remove(id: string) {
    return api.delete<void>(`/notifications/${id}`);
  },
};
