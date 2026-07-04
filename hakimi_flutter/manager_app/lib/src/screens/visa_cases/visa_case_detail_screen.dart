import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/visa_cases_providers.dart';

class VisaCaseDetailScreen extends ConsumerStatefulWidget {
  final String caseId;

  const VisaCaseDetailScreen({super.key, required this.caseId});

  @override
  ConsumerState<VisaCaseDetailScreen> createState() => _VisaCaseDetailScreenState();
}

class _VisaCaseDetailScreenState extends ConsumerState<VisaCaseDetailScreen> {
  @override
  Widget build(BuildContext context) {
    final caseAsync = ref.watch(visaCaseDetailProvider(widget.caseId));
    final theme = Theme.of(context);

    return caseAsync.when(
      data: (vc) {
        if (vc == null) {
          return Scaffold(
            appBar: AppBar(title: const Text('Dossier visa')),
            body: const EmptyState(
              icon: Icons.folder_off,
              title: 'Dossier introuvable',
            ),
          );
        }
        return Scaffold(
          appBar: AppBar(
            title: Text(vc.caseNumber),
            actions: [
              IconButton(
                icon: const Icon(Icons.edit),
                onPressed: () {},
              ),
            ],
          ),
          body: SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                _buildHeader(vc, theme),
                const SizedBox(height: 24),
                _buildCurrentStatus(vc, theme),
                const SizedBox(height: 24),
                _buildStatusHistory(vc, theme),
                if (vc.appointments != null) ...[
                  const SizedBox(height: 24),
                  _buildAppointmentsSection(vc, theme),
                ],
                if (vc.visaDetails != null) ...[
                  const SizedBox(height: 24),
                  _buildVisaDetailsSection(vc, theme),
                ],
                const SizedBox(height: 24),
                _buildActionButtons(vc),
              ],
            ),
          ),
        );
      },
      error: (e, _) => Scaffold(
        appBar: AppBar(title: const Text('Dossier visa')),
        body: AppErrorWidget(
          message: e.toString(),
          onRetry: () => ref.invalidate(visaCaseDetailProvider(widget.caseId)),
        ),
      ),
      loading: () => Scaffold(
        appBar: AppBar(title: const Text('Dossier visa')),
        body: const Center(child: CircularProgressIndicator()),
      ),
    );
  }

  Widget _buildHeader(VisaCaseModel vc, ThemeData theme) {
    final clientName = vc.client is Map
        ? (vc.client as Map)['full_name'] as String? ?? 'N/A'
        : vc.client?.toString() ?? 'N/A';

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Expanded(
                child: Text(vc.caseNumber,
                    style: theme.textTheme.titleLarge
                        ?.copyWith(fontWeight: FontWeight.bold)),
              ),
              StatusBadge(status: vc.currentStatus),
            ],
          ),
          const SizedBox(height: 8),
          Text('Client: $clientName',
              style: theme.textTheme.bodyMedium),
          const SizedBox(height: 4),
          Text('${vc.visaCountry} - ${vc.visaType}',
              style: theme.textTheme.bodySmall),
          const SizedBox(height: 4),
          Text('Créé le: ${vc.createdAt?.formatDate() ?? ''}',
              style: theme.textTheme.bodySmall?.copyWith(
                  color: theme.colorScheme.onSurfaceVariant)),
        ],
      ),
    );
  }

  Widget _buildCurrentStatus(VisaCaseModel vc, ThemeData theme) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Statut actuel',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          Row(
            children: [
              Container(
                width: 16,
                height: 16,
                decoration: BoxDecoration(
                  color: vc.currentStatus.color,
                  shape: BoxShape.circle,
                ),
              ),
              const SizedBox(width: 12),
              Text(
                vc.currentStatus.displayName,
                style: theme.textTheme.titleLarge?.copyWith(
                  fontWeight: FontWeight.bold,
                  color: vc.currentStatus.color,
                ),
              ),
            ],
          ),
        ],
      ),
    );
  }

  Widget _buildStatusHistory(VisaCaseModel vc, ThemeData theme) {
    final history = vc.statusHistories ?? [];
    if (history.isEmpty) {
      return const SizedBox();
    }

    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Historique des statuts',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          ...history.map((h) => Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    Container(
                      width: 12,
                      height: 12,
                      decoration: BoxDecoration(
                        color: h.newStatus.color,
                        shape: BoxShape.circle,
                      ),
                    ),
                    const SizedBox(width: 12),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            '${h.oldStatus.displayName} → ${h.newStatus.displayName}',
                            style: theme.textTheme.bodyMedium,
                          ),
                          Text(
                            '${h.changedBy} - ${h.changedAt.formatRelative()}',
                            style: theme.textTheme.bodySmall?.copyWith(
                              color: theme.colorScheme.onSurfaceVariant,
                            ),
                          ),
                        ],
                      ),
                    ),
                  ],
                ),
              )),
        ],
      ),
    );
  }

  Widget _buildAppointmentsSection(VisaCaseModel vc, ThemeData theme) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Rendez-vous',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          if (vc.appointments is List && (vc.appointments as List).isEmpty)
            Text('Aucun rendez-vous',
                style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant))
          else
            ...?((vc.appointments as List?)?.map((a) {
              final map = a as Map<String, dynamic>?;
              if (map == null) return const SizedBox();
              return Padding(
                padding: const EdgeInsets.only(bottom: 8),
                child: Row(
                  children: [
                    const Icon(Icons.calendar_today, size: 16),
                    const SizedBox(width: 8),
                    Expanded(
                      child: Text(
                        '${map['appointment_date'] ?? ''} à ${map['appointment_time'] ?? ''}',
                        style: theme.textTheme.bodyMedium,
                      ),
                    ),
                  ],
                ),
              );
            })),
        ],
      ),
    );
  }

  Widget _buildVisaDetailsSection(VisaCaseModel vc, ThemeData theme) {
    final vd = vc.visaDetails!;
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Détails du visa',
              style: theme.textTheme.titleMedium
                  ?.copyWith(fontWeight: FontWeight.w600)),
          const SizedBox(height: 12),
          _DetailRow(label: 'Numéro', value: vd.visaNumber ?? ''),
          _DetailRow(
              label: 'Valide du',
              value: vd.validFrom.formatDate()),
          _DetailRow(
              label: 'Valide jusqu\'au',
              value: vd.validUntil.formatDate()),
          _DetailRow(
              label: 'Durée', value: '${vd.durationDays} jours'),
          _DetailRow(
              label: 'Type d\'entrée',
              value: vd.entryType.displayName),
          if (vd.notes != null)
            _DetailRow(label: 'Notes', value: vd.notes!),
        ],
      ),
    );
  }

  Widget _buildActionButtons(VisaCaseModel vc) {
    return Column(
      children: [
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () => _showStatusChangeSheet(vc),
            icon: const Icon(Icons.swap_horiz),
            label: const Text('Changer le statut'),
          ),
        ),
        const SizedBox(height: 8),
        SizedBox(
          width: double.infinity,
          child: OutlinedButton.icon(
            onPressed: () {},
            icon: const Icon(Icons.calendar_today),
            label: const Text('Ajouter un rendez-vous'),
          ),
        ),
      ],
    );
  }

  void _showStatusChangeSheet(VisaCaseModel vc) {
    showModalBottomSheet(
      context: context,
      builder: (ctx) => _StatusChangeSheet(
        currentStatus: vc.currentStatus,
        caseId: vc.id ?? '',
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
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          SizedBox(
            width: 120,
            child: Text(label,
                style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant)),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _StatusChangeSheet extends ConsumerStatefulWidget {
  final VisaStatus currentStatus;
  final String caseId;

  const _StatusChangeSheet({
    required this.currentStatus,
    required this.caseId,
  });

  @override
  ConsumerState<_StatusChangeSheet> createState() => _StatusChangeSheetState();
}

class _StatusChangeSheetState extends ConsumerState<_StatusChangeSheet> {
  bool _isUpdating = false;

  Future<void> _changeStatus(VisaStatus newStatus) async {
    if (newStatus == widget.currentStatus) return;

    setState(() => _isUpdating = true);
    try {
      await ref.read(updateVisaCaseStatusProvider((
        id: widget.caseId,
        status: newStatus,
      )).future);

      if (mounted) {
        Navigator.of(context).pop();
        ref.invalidate(visaCaseDetailProvider(widget.caseId));
        context.showSuccess('Statut mis à jour');
      }
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (e) {
      if (mounted) context.showError('Erreur de mise à jour');
    } finally {
      if (mounted) setState(() => _isUpdating = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return Padding(
      padding: const EdgeInsets.all(16),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Text('Changer le statut',
              style: theme.textTheme.titleLarge),
          const SizedBox(height: 16),
          ...VisaStatus.values.map((status) {
            final isCurrent = status == widget.currentStatus;
            return Padding(
              padding: const EdgeInsets.only(bottom: 8),
              child: ListTile(
                leading: Container(
                  width: 16,
                  height: 16,
                  decoration: BoxDecoration(
                    color: status.color,
                    shape: BoxShape.circle,
                  ),
                ),
                title: Text(status.displayName),
                trailing: isCurrent
                    ? const Icon(Icons.check, color: Colors.green)
                    : null,
                onTap: isCurrent || _isUpdating
                    ? null
                    : () => _changeStatus(status),
                enabled: !isCurrent,
              ),
            );
          }),
          if (_isUpdating)
            const Center(child: CircularProgressIndicator()),
        ],
      ),
    );
  }
}
