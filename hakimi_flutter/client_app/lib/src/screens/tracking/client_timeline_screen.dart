import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class ClientTimelineScreen extends ConsumerWidget {
  final String caseNumber;

  const ClientTimelineScreen({super.key, required this.caseNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncTimeline = ref.watch(trackingTimelineProvider(caseNumber));

    return Scaffold(
      appBar: AppBar(title: const Text('Chronologie')),
      body: asyncTimeline.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(trackingTimelineProvider(caseNumber)),
        ),
        data: (entries) {
          if (entries.isEmpty) {
            return const EmptyState(
              icon: Icons.timeline,
              title: 'Aucun événement',
              subtitle: 'Aucun événement n\'a été enregistré pour ce dossier.',
            );
          }

          final grouped = _groupByDate(entries);

          return ListView(
            padding: const EdgeInsets.all(AppSpacing.md),
            children: grouped.entries.map((entry) {
              return Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  Padding(
                    padding: const EdgeInsets.symmetric(
                      vertical: AppSpacing.sm,
                    ),
                    child: Text(
                      entry.key,
                      style: context.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                        color: context.colorScheme.primary,
                      ),
                    ),
                  ),
                  ...entry.value.map((timelineEntry) {
                    return _TimelineEntryWidget(entry: timelineEntry);
                  }),
                ],
              );
            }).toList(),
          );
        },
      ),
    );
  }

  Map<String, List<TimelineEntry>> _groupByDate(List<TimelineEntry> entries) {
    final map = <String, List<TimelineEntry>>{};
    for (final entry in entries) {
      final dateKey = entry.timestamp.formatDate();
      map.putIfAbsent(dateKey, () => []);
      map[dateKey]!.add(entry);
    }
    return map;
  }
}

class _TimelineEntryWidget extends StatelessWidget {
  final TimelineEntry entry;

  const _TimelineEntryWidget({required this.entry});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final iconColor = _iconColorForType(entry.type);

    return Padding(
      padding: const EdgeInsets.only(left: 8, bottom: AppSpacing.sm),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            mainAxisSize: MainAxisSize.min,
            children: [
              Container(
                width: 32,
                height: 32,
                decoration: BoxDecoration(
                  color: iconColor.withValues(alpha: 0.12),
                  shape: BoxShape.circle,
                ),
                child: Icon(
                  _iconForType(entry.type),
                  size: 16,
                  color: iconColor,
                ),
              ),
              Container(
                width: 2,
                height: 96,
                color: theme.dividerColor,
              ),
            ],
          ),
          const SizedBox(width: AppSpacing.sm),
          Expanded(
            child: Card(
              margin: const EdgeInsets.only(bottom: AppSpacing.sm),
              child: Padding(
                padding: const EdgeInsets.all(AppSpacing.md),
                child: Column(
                  crossAxisAlignment: CrossAxisAlignment.start,
                  children: [
                    Text(
                      entry.label,
                      style: theme.textTheme.bodyMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                    if (entry.description.isNotEmpty) ...[
                      const SizedBox(height: 4),
                      Text(
                        entry.description,
                        style: theme.textTheme.bodySmall,
                      ),
                    ],
                    const SizedBox(height: 4),
                    Text(
                      entry.timestamp.formatTime(),
                      style: theme.textTheme.labelSmall?.copyWith(
                        color: theme.colorScheme.onSurfaceVariant,
                      ),
                    ),
                  ],
                ),
              ),
            ),
          ),
        ],
      ),
    );
  }

  IconData _iconForType(String type) {
    switch (type) {
      case 'status_change':
        return Icons.swap_horiz;
      case 'appointment':
        return Icons.calendar_today;
      case 'document':
        return Icons.description;
      case 'note':
        return Icons.note_add;
      case 'payment':
        return Icons.payment;
      default:
        return Icons.info_outline;
    }
  }

  Color _iconColorForType(String type) {
    switch (type) {
      case 'status_change':
        return AppColors.info;
      case 'appointment':
        return AppColors.statusRdvOk;
      case 'document':
        return AppColors.warning;
      case 'note':
        return AppColors.primary;
      case 'payment':
        return AppColors.success;
      default:
        return AppColors.textSecondaryLight;
    }
  }
}
