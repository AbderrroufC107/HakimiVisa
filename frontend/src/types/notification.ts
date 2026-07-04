export type NotificationType =
  | 'INFO'
  | 'WARNING'
  | 'ERROR'
  | 'SUCCESS'
  | 'VISA_EXPIRING'
  | 'APPOINTMENT_REMINDER'
  | 'STATUS_CHANGE'
  | 'SYSTEM';

export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  read: boolean;
  userId: string;
  link?: string;
  createdAt: string;
}

export interface NotificationsMeta {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  unreadCount: number;
}
