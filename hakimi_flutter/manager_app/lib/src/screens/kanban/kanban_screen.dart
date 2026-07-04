import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/kanban_providers.dart';

class KanbanScreen extends ConsumerStatefulWidget {
  const KanbanScreen({super.key});

  @override
  ConsumerState<KanbanScreen> createState() => _KanbanScreenState();
}

class _KanbanScreenState extends ConsumerState<KanbanScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final kanbanAsync = ref.watch(kanbanColumnsProvider);
    final l10n = context.l10n;

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SearchField(
              hintText: l10n.translate('searchCase'),
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
          ),
          Expanded(
            child: kanbanAsync.when(
              data: (columns) {
                final cards =
                    columns
                        .expand((column) => column.cards)
                        .where((card) => _matchesSearch(card, _searchQuery))
                        .toList()
                      ..sort((a, b) => b.createdAt.compareTo(a.createdAt));

                if (cards.isEmpty) {
                  return EmptyState(
                    icon: Icons.folder_copy_outlined,
                    title: l10n.translate('noCase'),
                    subtitle: l10n.translate('noCaseToTrack'),
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(kanbanColumnsProvider),
                  child: ListView.separated(
                    padding: const EdgeInsets.fromLTRB(16, 8, 16, 24),
                    itemCount: cards.length,
                    separatorBuilder: (_, __) =>
                        const SizedBox(height: AppSpacing.sm),
                    itemBuilder: (context, index) {
                      return _CaseTrackingCard(card: cards[index]);
                    },
                  ),
                );
              },
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.invalidate(kanbanColumnsProvider),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
    );
  }

  bool _matchesSearch(KanbanCardModel card, String query) {
    final normalized = query.trim().toLowerCase();
    if (normalized.isEmpty) return true;

    return card.caseNumber.toLowerCase().contains(normalized) ||
        card.clientName.toLowerCase().contains(normalized) ||
        card.visaCountry.toLowerCase().contains(normalized) ||
        card.visaType.toLowerCase().contains(normalized);
  }
}

class _CaseTrackingCard extends StatelessWidget {
  final KanbanCardModel card;

  const _CaseTrackingCard({required this.card});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final daysSince = DateTime.now().difference(card.createdAt).inDays;

    return AppCard(
      onTap: () => context.push('/visa-cases/${card.id}'),
      padding: const EdgeInsets.all(AppSpacing.md),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              Expanded(
                child: Text(
                  card.caseNumber,
                  style: theme.textTheme.titleMedium?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
              const SizedBox(width: AppSpacing.sm),
              StatusBadge(status: card.status),
            ],
          ),
          const SizedBox(height: AppSpacing.sm),
          Text(
            card.clientName,
            style: theme.textTheme.bodyMedium,
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: 2),
          Text(
            '${card.visaCountry} - ${card.visaType}',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
            maxLines: 1,
            overflow: TextOverflow.ellipsis,
          ),
          const SizedBox(height: AppSpacing.sm),
          Align(
            alignment: AlignmentDirectional.centerEnd,
            child: Text(
              'J-$daysSince',
              style: theme.textTheme.labelMedium?.copyWith(
                color: card.status.color,
                fontWeight: FontWeight.w700,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
