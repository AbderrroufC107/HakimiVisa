import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';

class TimelineScreen extends ConsumerWidget {
  final String clientId;

  const TimelineScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(clientTimelineProvider(clientId));
    final theme = Theme.of(context);

    return timelineAsync.when(
        data: (entries) {
          if (entries.isEmpty) {
            return const EmptyState(
              icon: Icons.timeline,
              title: 'Aucune activité',
              subtitle: 'Les événements apparaîtront ici',
            );
          }

          final grouped = <String, List<TimelineEntry>>{};
          for (final entry in entries) {
            final dateKey = entry.timestamp.formatDate();
            grouped.putIfAbsent(dateKey, () => []);
            grouped[dateKey]!.add(entry);
          }

          return ListView(
            padding: const EdgeInsets.all(16),
            children: grouped.entries.map((group) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(vertical: 8),
                    child: Text(
                      group.key,
                      style: theme.textTheme.titleSmall?.copyWith(
                        color: theme.colorScheme.primary,
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ...group.value.map((entry) => Padding(
                    padding: const EdgeInsets.only(left: 8, bottom: 12),
                    child: Row(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        Icon(
                          _iconForType(entry.type),
                          size: 20,
                          color: theme.colorScheme.primary,
                        ),
                        const SizedBox(width: 12),
                        Expanded(
                          child: Column(
                            crossAxisAlignment: CrossAxisAlignment.start,
                            children: [
                              Text(
                                entry.label,
                                style: theme.textTheme.titleSmall?.copyWith(
                                  fontWeight: FontWeight.w600,
                                ),
                              ),
                              const SizedBox(height: 2),
                              Text(
                                entry.description,
                                style: theme.textTheme.bodySmall,
                              ),
                              const SizedBox(height: 2),
                              Text(
                                entry.timestamp.formatTime(),
                                style: theme.textTheme.labelSmall?.copyWith(
                                  color: theme.colorScheme.onSurfaceVariant,
                                ),
                              ),
                            ],
                          ),
                        ),
                      ],
                    ),
                  )),
                  const Divider(),
                ],
              );
            }).toList(),
          );
        },
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(clientTimelineProvider(clientId)),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'visa_case_created':
        return Icons.note_add;
      case 'status_change':
        return Icons.swap_horiz;
      case 'appointment_created':
        return Icons.calendar_today;
      case 'document_uploaded':
        return Icons.upload_file;
      default:
        return Icons.circle;
    }
  }
}
