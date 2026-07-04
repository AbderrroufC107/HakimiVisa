import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/notifications_providers.dart';

class NotificationsListScreen extends ConsumerWidget {
  const NotificationsListScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final notificationsAsync = ref.watch(notificationsProvider);
    final theme = Theme.of(context);

    return RefreshIndicator(
        onRefresh: () async {
          ref.invalidate(notificationsProvider);
          ref.invalidate(unreadCountProvider);
        },
        child: notificationsAsync.when(
          data: (notifications) {
            if (notifications.isEmpty) {
              return const EmptyState(
                icon: Icons.notifications_off,
                title: 'Aucune notification',
                subtitle: 'Vous serez notifié des mises à jour',
              );
            }
            return ListView.builder(
              padding: const EdgeInsets.all(16),
              itemCount: notifications.length,
              itemBuilder: (context, index) {
                final notif = notifications[index];
                return Dismissible(
                  key: Key(notif.id),
                  direction: DismissDirection.endToStart,
                  background: Container(
                    alignment: Alignment.centerRight,
                    padding: const EdgeInsets.only(right: 16),
                    color: Colors.red,
                    child: const Icon(Icons.delete, color: Colors.white),
                  ),
                  onDismissed: (_) async {
                    try {
                      await ref
                          .read(markNotificationReadProvider(notif.id).future);
                      ref.invalidate(notificationsProvider);
                      ref.invalidate(unreadCountProvider);
                    } catch (_) {}
                  },
                  child: AppCard(
                    margin: const EdgeInsets.only(bottom: 8),
                    onTap: () async {
                      if (!notif.read) {
                        await ref
                            .read(markNotificationReadProvider(notif.id).future);
                        ref.invalidate(notificationsProvider);
                        ref.invalidate(unreadCountProvider);
                      }
                    },
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Container(
                          padding: const EdgeInsets.all(8),
                          decoration: BoxDecoration(
                            color: notif.type.color.withValues(alpha: 0.12),
                            borderRadius: BorderRadius.circular(8),
                          ),
                          child: Icon(
                            notif.type.icon,
                            color: notif.type.color,
                            size: 20,
                          ),
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Row(
                                children: [
                                  Expanded(
                                    child: Text(
                                      notif.title,
                                      style: theme.textTheme.titleSmall?.copyWith(
                                        fontWeight: notif.read
                                            ? FontWeight.normal
                                            : FontWeight.bold,
                                      ),
                                    ),
                                  ),
                                  if (!notif.read)
                                    Container(
                                      width: 8,
                                      height: 8,
                                      decoration: const BoxDecoration(
                                        color: Colors.blue,
                                        shape: BoxShape.circle,
                                      ),
                                    ),
                                ],
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif.message,
                                style: theme.textTheme.bodySmall,
                              ),
                              const SizedBox(height: 4),
                              Text(
                                notif.createdAt.formatRelative(),
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
              },
            );
          },
          error: (e, _) => AppErrorWidget(
            message: e.toString(),
            onRetry: () {
              ref.invalidate(notificationsProvider);
              ref.invalidate(unreadCountProvider);
            },
          ),
          loading: () => const Center(child: CircularProgressIndicator()),
        ),
      );
  }
}
