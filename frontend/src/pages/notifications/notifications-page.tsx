import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { notificationsService } from '@/services';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
} from '@/components/ui/card';
import { EmptyState } from '@/components/shared';
import { Bell, CheckCheck, Trash2, Info, AlertTriangle, AlertCircle, CheckCircle, Clock, Calendar } from 'lucide-react';
import type { NotificationType } from '@/types';

const iconMap: Record<NotificationType, typeof Bell> = {
  INFO: Info,
  WARNING: AlertTriangle,
  ERROR: AlertCircle,
  SUCCESS: CheckCircle,
  VISA_EXPIRING: Clock,
  APPOINTMENT_REMINDER: Calendar,
  STATUS_CHANGE: Bell,
  SYSTEM: Info,
};

const colorMap: Record<NotificationType, string> = {
  INFO: 'text-blue-500',
  WARNING: 'text-yellow-500',
  ERROR: 'text-red-500',
  SUCCESS: 'text-green-500',
  VISA_EXPIRING: 'text-orange-500',
  APPOINTMENT_REMINDER: 'text-purple-500',
  STATUS_CHANGE: 'text-indigo-500',
  SYSTEM: 'text-gray-500',
};

export function NotificationsPage() {
  const [filter, setFilter] = useState<'all' | 'unread'>('all');
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? fr : enUS;
  const queryClient = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ['notifications', filter],
    queryFn: () => notificationsService.findAll(1, 50, filter === 'unread' ? false : undefined),
  });

  const markAllMutation = useMutation({
    mutationFn: notificationsService.markAllAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const markReadMutation = useMutation({
    mutationFn: notificationsService.markAsRead,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: notificationsService.remove,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['notifications'] });
    },
  });

  const notifications = data?.data ?? [];
  const unreadCount = data?.meta?.unreadCount ?? 0;

  return (
    <div className="mx-auto max-w-3xl space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold" data-testid="page-heading">{t('nav:notifications')}</h1>
          <p className="text-sm text-muted-foreground">
            {unreadCount > 0
              ? t('notifications:unreadCount', { count: unreadCount })
              : t('notifications:allUpToDate')}
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            data-testid="notifications-filter-all"
            variant={filter === 'all' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('all')}
          >
            {t('notifications:all')}
          </Button>
          <Button
            data-testid="notifications-filter-unread"
            variant={filter === 'unread' ? 'default' : 'outline'}
            size="sm"
            onClick={() => setFilter('unread')}
          >
            {t('notifications:unread')}
          </Button>
          {unreadCount > 0 && (
            <Button
              data-testid="notifications-mark-all-read"
              variant="outline"
              size="sm"
              onClick={() => markAllMutation.mutate()}
            >
              <CheckCheck className="mr-1 h-4 w-4" />
              {t('notifications:markAllRead')}
            </Button>
          )}
        </div>
      </div>

      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="divide-y">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex gap-4 px-6 py-4">
                  <div className="skeleton-shimmer h-5 w-5 rounded-full mt-1" />
                  <div className="flex-1 space-y-2">
                    <div className="skeleton-shimmer h-4 w-48 rounded" />
                    <div className="skeleton-shimmer h-3 w-64 rounded" />
                    <div className="skeleton-shimmer h-3 w-24 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : notifications.length === 0 ? (
            <div className="py-12">
              <EmptyState
                icon={Bell}
                title={t('notifications:noNotifications')}
                description={
                  filter === 'unread'
                    ? t('notifications:noUnread')
                    : t('notifications:noNotifications')
                }
              />
            </div>
          ) : (
            <ul className="divide-y">
              {notifications.map((notification) => {
                const Icon = iconMap[notification.type] ?? Bell;
                const colorClass = colorMap[notification.type] ?? 'text-blue-500';

                return (
                  <li
                    key={notification.id}
                    data-testid="notification-item"
                    data-notification-id={notification.id}
                    className={`group relative flex gap-4 px-6 py-4 transition-colors hover:bg-muted/50 ${
                      !notification.read ? 'bg-primary/5' : ''
                    }`}
                  >
                    <div className={`mt-1 ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <p
                            className={`text-sm ${
                              !notification.read ? 'font-semibold' : ''
                            }`}
                          >
                            {notification.title}
                          </p>
                          <p className="mt-0.5 text-sm text-muted-foreground">
                            {notification.message}
                          </p>
                        </div>
                      </div>
                      <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                        <span>
                          {formatDistanceToNow(new Date(notification.createdAt), {
                            addSuffix: true,
                            locale,
                          })}
                        </span>
                        <span>·</span>
                        <span>
                          {format(new Date(notification.createdAt), 'dd/MM/yyyy HH:mm', {
                            locale,
                          })}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-start gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                      {!notification.read && (
                        <Button
                          data-testid="notification-mark-read"
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => markReadMutation.mutate(notification.id)}
                          title={t('notifications:markAsRead')}
                        >
                          <CheckCheck className="h-4 w-4" />
                        </Button>
                      )}
                      <Button
                        data-testid="notification-delete"
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive"
                        onClick={() => deleteMutation.mutate(notification.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
