import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class ClientNotificationsScreen extends ConsumerWidget {
  const ClientNotificationsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = ref.watch(trackedPhoneProvider);
    final asyncNotifications = ref.watch(phoneNotificationsProvider(phone));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Notifications'),
      ),
      body: asyncNotifications.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(phoneNotificationsProvider(phone)),
        ),
        data: (notifications) {
          if (phone.isEmpty) {
            return const EmptyState(
              icon: Icons.phone_outlined,
              title: 'Recherchez d\'abord',
              subtitle: 'Entrez votre numéro de téléphone pour voir vos notifications.',
            );
          }
          if (notifications.isEmpty) {
            return const EmptyState(
              icon: Icons.notifications_off_outlined,
              title: 'Aucune notification',
              subtitle: 'Vous n\'avez aucune notification pour le moment.',
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(phoneNotificationsProvider(phone).future),
            child: ListView.separated(
              padding: const EdgeInsets.all(AppSpacing.md),
              itemCount: notifications.length,
              separatorBuilder: (_, __) => const Divider(height: 1),
              itemBuilder: (context, index) {
                final notification = notifications[index];
                return _NotificationItem(notification: notification);
              },
            ),
          );
        },
      ),
    );
  }
}

class _NotificationItem extends StatelessWidget {
  final NotificationModel notification;

  const _NotificationItem({required this.notification});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return InkWell(
      onTap: () {},
      child: AnimatedContainer(
        duration: const Duration(milliseconds: 300),
        padding: const EdgeInsets.symmetric(
          horizontal: AppSpacing.md,
          vertical: AppSpacing.sm,
        ),
        decoration: BoxDecoration(
          color: notification.read
              ? null
              : theme.colorScheme.primaryContainer.withValues(alpha: 0.3),
        ),
        child: Row(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Container(
              width: 40,
              height: 40,
              decoration: BoxDecoration(
                color: notification.type.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
              ),
              child: Icon(
                notification.type.icon,
                size: 20,
                color: notification.type.color,
              ),
            ),
            const SizedBox(width: AppSpacing.sm),
            Expanded(
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Row(
                    children: [
                      Expanded(
                        child: Text(
                          notification.title,
                          style: theme.textTheme.bodyMedium?.copyWith(
                            fontWeight: notification.read
                                ? FontWeight.normal
                                : FontWeight.w600,
                          ),
                        ),
                      ),
                      if (!notification.read)
                        Container(
                          width: 8,
                          height: 8,
                          decoration: const BoxDecoration(
                            color: AppColors.primary,
                            shape: BoxShape.circle,
                          ),
                        ),
                    ],
                  ),
                  const SizedBox(height: 2),
                  Text(
                    notification.message,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    maxLines: 2,
                    overflow: TextOverflow.ellipsis,
                  ),
                  const SizedBox(height: 4),
                  Text(
                    notification.createdAt.formatRelative(),
                    style: theme.textTheme.labelSmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
          ],
        ),
      ),
    );
  }
}
