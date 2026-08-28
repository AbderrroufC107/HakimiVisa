import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class TrackingResultsScreen extends ConsumerWidget {
  const TrackingResultsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = ref.watch(trackedPhoneProvider);
    final reference = ref.watch(trackedReferenceProvider);
    final params = (query: phone, reference: reference);
    final asyncResult = ref.watch(trackingSearchProvider(params));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Résultats de recherche'),
        leading: IconButton(
          icon: const Icon(Icons.arrow_back),
          onPressed: () => context.pop(),
        ),
      ),
      body: asyncResult.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(trackingSearchProvider(params)),
        ),
        data: (result) {
          if (result.cases.isEmpty) {
            return EmptyState(
              icon: Icons.search_off,
              title: 'Aucun dossier trouvé',
              subtitle: 'Aucun dossier de visa associé à ces informations.',
              action: ElevatedButton(
                onPressed: () => context.pop(),
                child: const Text('Nouvelle recherche'),
              ),
            );
          }

          return RefreshIndicator(
            onRefresh: () => ref.refresh(
              trackingSearchProvider(params).future,
            ),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.md),
                  child: Row(
                    children: [
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              // One number can belong to a household, and the
                              // name at the top would then be only one of
                              // them — say so rather than mislabel the rest.
                              _headline(result),
                              style: context.textTheme.titleLarge,
                            ),
                            const SizedBox(height: 4),
                            Text(
                              '${result.total} dossier${result.total > 1 ? 's' : ''} trouvé${result.total > 1 ? 's' : ''}',
                              style: context.textTheme.bodyMedium?.copyWith(
                                color: context.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                ),
                ...result.cases.map((caseData) {
                  final caseModel = VisaCaseModel.fromJson(caseData);
                  return _VisaCaseCard(caseModel: caseModel);
                }),
              ],
            ),
          );
        },
      ),
    );
  }
}

/// Names the holder when the files belong to one person, and says how many
/// people share the line when they do not.
String _headline(TrackingQueryResult result) {
  final names = result.cases
      .map((c) => c['client'] is Map ? c['client']['fullName'] as String? : null)
      .whereType<String>()
      .toSet();
  if (names.length > 1) return '${names.length} personnes sur ce numéro';
  return 'Client: ${names.isNotEmpty ? names.first : result.clientName}';
}

class _VisaCaseCard extends StatelessWidget {
  final VisaCaseModel caseModel;

  const _VisaCaseCard({required this.caseModel});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        onTap: () => context.push('/tracking/${caseModel.caseNumber}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        caseModel.caseNumber,
                        style: theme.textTheme.titleMedium?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      // A shared line returns the whole household's files, so
                      // each one says who it belongs to.
                      if (caseModel.clientName != null)
                        Text(
                          caseModel.clientName!,
                          style: theme.textTheme.bodySmall?.copyWith(
                            color: context.colorScheme.onSurfaceVariant,
                          ),
                        ),
                    ],
                  ),
                ),
                StatusBadge(status: caseModel.currentStatus),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(Icons.public_outlined,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  caseModel.visaCountry,
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(width: AppSpacing.md),
                Icon(Icons.category_outlined,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  caseModel.visaType,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.xs),
            Row(
              children: [
                Icon(Icons.calendar_today_outlined,
                    size: 16, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  'Ouvert le ${caseModel.openingDate.formatDate()}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ],
        ),
      ),
    );
  }
}
