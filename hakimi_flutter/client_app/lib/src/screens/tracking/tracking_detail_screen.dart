import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class TrackingDetailScreen extends ConsumerWidget {
  final String caseNumber;

  const TrackingDetailScreen({super.key, required this.caseNumber});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final asyncCase = ref.watch(trackingCaseDetailProvider(caseNumber));

    return Scaffold(
      appBar: AppBar(
        title: const Text('Détail du dossier'),
      ),
      body: asyncCase.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(trackingCaseDetailProvider(caseNumber)),
        ),
        data: (caseData) {
          return RefreshIndicator(
            onRefresh: () => ref.refresh(
              trackingCaseDetailProvider(caseNumber).future,
            ),
            child: SingleChildScrollView(
              physics: const AlwaysScrollableScrollPhysics(),
              padding: const EdgeInsets.all(AppSpacing.md),
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.stretch,
                children: [
                  _StatusCard(caseData: caseData),
                  const SizedBox(height: AppSpacing.md),
                  _TimelinePreview(caseData: caseData, caseNumber: caseNumber),
                  if (caseData.visaDetails != null) ...[
                    const SizedBox(height: AppSpacing.md),
                    _VisaDetailsSection(visaDetails: caseData.visaDetails!),
                  ],
                  const SizedBox(height: AppSpacing.md),
                  _CaseInfoCard(caseData: caseData),
                  const SizedBox(height: AppSpacing.md),
                  _ContactFooter(),
                ],
              ),
            ),
          );
        },
      ),
    );
  }
}

class _StatusCard extends StatelessWidget {
  final VisaCaseModel caseData;

  const _StatusCard({required this.caseData});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final status = caseData.currentStatus;

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          children: [
            Container(
              width: 72,
              height: 72,
              decoration: BoxDecoration(
                color: status.color.withValues(alpha: 0.12),
                shape: BoxShape.circle,
                border: Border.all(
                  color: status.color.withValues(alpha: 0.4),
                  width: 2,
                ),
              ),
              child: Icon(
                _iconForStatus(status),
                size: 36,
                color: status.color,
              ),
            ),
            const SizedBox(height: AppSpacing.md),
            Text(
              status.displayName,
              style: theme.textTheme.headlineSmall?.copyWith(
                color: status.color,
                fontWeight: FontWeight.bold,
              ),
            ),
            const SizedBox(height: AppSpacing.sm),
            Text(
              '${caseData.visaCountry} - ${caseData.visaType}',
              style: theme.textTheme.bodyMedium,
            ),
          ],
        ),
      ),
    );
  }

  IconData _iconForStatus(VisaStatus status) {
    switch (status) {
      case VisaStatus.enAttente:
        return Icons.hourglass_empty;
      case VisaStatus.enTraitement:
        return Icons.sync;
      case VisaStatus.rdvOk:
        return Icons.event_available;
      case VisaStatus.visaOk:
        return Icons.check_circle;
      case VisaStatus.visaRefusee:
        return Icons.cancel;
    }
  }
}

class _TimelinePreview extends StatelessWidget {
  final VisaCaseModel caseData;
  final String caseNumber;

  const _TimelinePreview({required this.caseData, required this.caseNumber});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;
    final histories = caseData.statusHistories ?? [];

    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            SectionHeader(
              title: 'Chronologie',
              trailing: TextButton(
                onPressed: () => context.push('/tracking/$caseNumber/timeline'),
                child: const Text('Voir tout'),
              ),
            ),
            if (histories.isEmpty)
              Padding(
                padding: const EdgeInsets.symmetric(vertical: AppSpacing.sm),
                child: Text(
                  'Aucun historique disponible',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              )
            else
              ...histories.take(3).map((history) {
                return Padding(
                  padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                  child: Row(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Column(
                        children: [
                          Icon(Icons.circle,
                              size: 12, color: history.newStatus.color),
                          Container(
                            width: 2,
                            height: 30,
                            color: theme.dividerColor,
                          ),
                        ],
                      ),
                      const SizedBox(width: AppSpacing.sm),
                      Expanded(
                        child: Column(
                          crossAxisAlignment: CrossAxisAlignment.start,
                          children: [
                            Text(
                              history.newStatus.displayName,
                              style: theme.textTheme.bodyMedium?.copyWith(
                                fontWeight: FontWeight.w500,
                              ),
                            ),
                            Text(
                              history.changedAt.formatRelative(),
                              style: theme.textTheme.bodySmall?.copyWith(
                                color: theme.colorScheme.onSurfaceVariant,
                              ),
                            ),
                          ],
                        ),
                      ),
                    ],
                  ),
                );
              }),
          ],
        ),
      ),
    );
  }
}

class _VisaDetailsSection extends StatelessWidget {
  final VisaDetailsModel visaDetails;

  const _VisaDetailsSection({required this.visaDetails});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(title: 'Détails du visa'),
            const SizedBox(height: AppSpacing.sm),
            _DetailRow(
              label: 'Numéro de visa',
              value: visaDetails.visaNumber ?? '-',
            ),
            _DetailRow(
              label: 'Valide du',
              value: visaDetails.validFrom.formatDate(),
            ),
            _DetailRow(
              label: 'Valide jusqu\'au',
              value: visaDetails.validUntil.formatDate(),
            ),
            _DetailRow(
              label: 'Durée',
              value: '${visaDetails.durationDays} jours',
            ),
            _DetailRow(
              label: 'Type d\'entrée',
              value: visaDetails.entryType.displayName,
            ),
          ],
        ),
      ),
    );
  }
}

class _CaseInfoCard extends StatelessWidget {
  final VisaCaseModel caseData;

  const _CaseInfoCard({required this.caseData});

  @override
  Widget build(BuildContext context) {
    return Card(
      child: Padding(
        padding: const EdgeInsets.all(AppSpacing.lg),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            const SectionHeader(title: 'Informations du dossier'),
            const SizedBox(height: AppSpacing.sm),
            _DetailRow(label: 'Numéro de dossier', value: caseData.caseNumber),
            _DetailRow(label: 'Pays de visa', value: caseData.visaCountry),
            _DetailRow(label: 'Type de visa', value: caseData.visaType),
            _DetailRow(
              label: 'Date d\'ouverture',
              value: caseData.openingDate.formatDate(),
            ),
            if (caseData.notes != null && caseData.notes!.isNotEmpty)
              _DetailRow(label: 'Notes', value: caseData.notes!),
          ],
        ),
      ),
    );
  }
}

class _ContactFooter extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return Container(
      padding: const EdgeInsets.all(AppSpacing.md),
      decoration: BoxDecoration(
        color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.3),
        borderRadius: BorderRadius.circular(AppSpacing.borderRadiusMedium),
      ),
      child: Column(
        children: [
          Icon(Icons.support_agent_outlined,
              size: 28, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(height: AppSpacing.sm),
          Text(
            'Besoin d\'aide ? Contactez notre agence',
            style: theme.textTheme.bodySmall?.copyWith(
              color: theme.colorScheme.onSurfaceVariant,
            ),
          ),
          const SizedBox(height: AppSpacing.sm),
          TextButton(
            onPressed: () => context.push('/contact'),
            child: const Text('Nous contacter'),
          ),
        ],
      ),
    );
  }
}

class _DetailRow extends StatelessWidget {
  final String label;
  final String value;

  const _DetailRow({required this.label, required this.value});

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 4),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 140,
            child: Text(
              label,
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
