import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';
import '../../providers/visa_cases_providers.dart';

class ClientDetailScreen extends ConsumerWidget {
  final String clientId;

  const ClientDetailScreen({super.key, required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final clientAsync = ref.watch(clientDetailProvider(clientId));
    final theme = Theme.of(context);

    return clientAsync.when(
      data: (client) {
        if (client == null) {
          return const EmptyState(
            icon: Icons.person_off,
            title: 'Client introuvable',
          );
        }
        return DefaultTabController(
          length: 4,
          child: Stack(
            children: [
              Column(
                children: [
                  Material(
                    color: theme.colorScheme.surface,
                    child: Column(
                      children: [
                        Padding(
                          padding: const EdgeInsets.fromLTRB(16, 8, 16, 0),
                          child: Row(
                            children: [
                              IconButton(
                                icon: const Icon(Icons.arrow_back),
                                onPressed: () => context.pop(),
                              ),
                              Expanded(
                                child: Text(
                                  client.fullName,
                                  style: theme.textTheme.titleLarge,
                                ),
                              ),
                            ],
                          ),
                        ),
                        const TabBar(
                          isScrollable: true,
                          tabs: [
                            Tab(text: 'Infos'),
                            Tab(text: 'Dossiers visa'),
                            Tab(text: 'Chronologie'),
                            Tab(text: 'Documents'),
                          ],
                        ),
                      ],
                    ),
                  ),
                  Expanded(
                    child: TabBarView(
                      children: [
                        _InfoTab(client: client),
                        _VisaCasesTab(client: client),
                        _TimelineTab(clientId: client.id),
                        _DocumentsTab(client: client),
                      ],
                    ),
                  ),
                ],
              ),
              Positioned(
                bottom: 16,
                right: 16,
                child: FloatingActionButton.extended(
                  onPressed: () {
                    showModalBottomSheet(
                      context: context,
                      builder: (_) => _AddVisaCaseSheet(clientId: client.id),
                    );
                  },
                  icon: const Icon(Icons.add),
                  label: const Text('Nouveau dossier'),
                ),
              ),
            ],
          ),
        );
      },
      error: (e, _) => AppErrorWidget(
        message: e.toString(),
        onRetry: () => ref.invalidate(clientDetailProvider(clientId)),
      ),
      loading: () => const Center(child: CircularProgressIndicator()),
    );
  }
}

class _InfoTab extends StatelessWidget {
  final ClientModel client;

  const _InfoTab({required this.client});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);

    return SingleChildScrollView(
      padding: const EdgeInsets.all(16),
      child: Column(
        children: [
          AvatarWidget(
            initials: client.fullName.isNotEmpty ? client.fullName[0] : '?',
            size: 80,
          ),
          const SizedBox(height: 16),
          Text(client.fullName, style: theme.textTheme.headlineSmall),
          const SizedBox(height: 24),
          _InfoRow(icon: Icons.phone, label: 'Téléphone', value: client.phoneNumber),
          if (client.whatsappNumber != null)
            _InfoRow(icon: Icons.chat, label: 'WhatsApp', value: client.whatsappNumber!),
          if (client.email != null)
            _InfoRow(icon: Icons.email, label: 'Email', value: client.email!),
          _InfoRow(icon: Icons.credit_card, label: 'Passeport', value: client.passportNumber),
          if (client.nationality != null && client.nationality!.isNotEmpty)
            _InfoRow(icon: Icons.flag, label: 'Nationalité', value: client.nationality!),
          if (client.notes != null && client.notes!.isNotEmpty)
            _InfoRow(icon: Icons.note, label: 'Notes', value: client.notes!),
          _InfoRow(
            icon: Icons.calendar_today,
            label: 'Créé le',
            value: client.createdAt.formatDate(),
          ),
        ],
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        children: [
          Icon(icon, size: 20, color: theme.colorScheme.primary),
          const SizedBox(width: 12),
          SizedBox(
            width: 100,
            child: Text(
              label,
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(value, style: theme.textTheme.bodyMedium),
          ),
        ],
      ),
    );
  }
}

class _VisaCasesTab extends ConsumerWidget {
  final ClientModel client;

  const _VisaCasesTab({required this.client});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (client.visaCases == null || client.visaCases!.isEmpty) {
      return const EmptyState(
        icon: Icons.folder_open,
        title: 'Aucun dossier visa',
      );
    }

    return ListView.builder(
      padding: const EdgeInsets.all(16),
      itemCount: client.visaCases!.length,
      itemBuilder: (context, index) {
        final vc = client.visaCases![index];
        return AppCard(
          margin: const EdgeInsets.only(bottom: 8),
          onTap: () => context.push('/visa-cases/${vc.id}'),
          child: ListTile(
            title: Text(vc.caseNumber),
            subtitle: Text('${vc.visaCountry} - ${vc.visaType}'),
            trailing: StatusBadge(status: vc.currentStatus),
          ),
        );
      },
    );
  }
}

class _TimelineTab extends ConsumerWidget {
  final String clientId;

  const _TimelineTab({required this.clientId});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final timelineAsync = ref.watch(clientTimelineProvider(clientId));

    return timelineAsync.when(
      data: (entries) {
        if (entries.isEmpty) {
          return const EmptyState(
            icon: Icons.timeline,
            title: 'Aucune activité',
          );
        }
        return ListView.builder(
          padding: const EdgeInsets.all(16),
          itemCount: entries.length,
          itemBuilder: (context, index) {
            final entry = entries[index];
            return TimelineTile(entry: entry);
          },
        );
      },
      error: (e, _) => AppErrorWidget(message: e.toString()),
      loading: () => const Center(child: CircularProgressIndicator()),
    );
  }
}

class TimelineTile extends StatelessWidget {
  final TimelineEntry entry;

  const TimelineTile({super.key, required this.entry});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 12),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Column(
            children: [
              Container(
                width: 12,
                height: 12,
                decoration: BoxDecoration(
                  color: theme.colorScheme.primary,
                  shape: BoxShape.circle,
                ),
              ),
              Expanded(
                child: Container(
                  width: 2,
                  color: theme.colorScheme.outlineVariant,
                ),
              ),
            ],
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
                const SizedBox(height: 4),
                Text(
                  entry.description,
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(height: 4),
                Text(
                  entry.timestamp.formatRelative(),
                  style: theme.textTheme.labelSmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
        ],
      ),
    );
  }
}

class _DocumentsTab extends StatelessWidget {
  final ClientModel client;

  const _DocumentsTab({required this.client});

  @override
  Widget build(BuildContext context) {
    return const EmptyState(
      icon: Icons.description,
      title: 'Aucun document',
      subtitle: 'Les documents apparaîtront ici',
    );
  }
}

class _AddVisaCaseSheet extends ConsumerStatefulWidget {
  final String clientId;

  const _AddVisaCaseSheet({required this.clientId});

  @override
  ConsumerState<_AddVisaCaseSheet> createState() => _AddVisaCaseSheetState();
}

class _AddVisaCaseSheetState extends ConsumerState<_AddVisaCaseSheet> {
  final _formKey = GlobalKey<FormState>();
  final _countryController = TextEditingController();
  final _typeController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSaving = false;

  @override
  void dispose() {
    _countryController.dispose();
    _typeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleCreate() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      await ref.read(createVisaCaseProvider({
        'client_id': widget.clientId,
        'visa_country': _countryController.text.trim(),
        'visa_type': _typeController.text.trim(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      }).future);

      if (mounted) {
        Navigator.of(context).pop();
        context.showSuccess('Dossier créé avec succès');
        ref.invalidate(clientDetailProvider(widget.clientId));
      }
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (e) {
      if (mounted) context.showError('Erreur lors de la création');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: EdgeInsets.only(
        bottom: MediaQuery.of(context).viewInsets.bottom,
        left: 16,
        right: 16,
        top: 16,
      ),
      child: Form(
        key: _formKey,
        child: Column(
          mainAxisSize: MainAxisSize.min,
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Text(
              'Nouveau dossier visa',
              style: Theme.of(context).textTheme.titleLarge,
            ),
            const SizedBox(height: 16),
            TextFormField(
              controller: _countryController,
              decoration: const InputDecoration(
                labelText: 'Pays',
                prefixIcon: Icon(Icons.flag),
              ),
              validator: AppValidators.required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _typeController,
              decoration: const InputDecoration(
                labelText: 'Type de visa',
                prefixIcon: Icon(Icons.flight),
              ),
              validator: AppValidators.required,
            ),
            const SizedBox(height: 12),
            TextFormField(
              controller: _notesController,
              maxLines: 2,
              decoration: const InputDecoration(
                labelText: 'Notes',
                prefixIcon: Icon(Icons.note),
                alignLabelWithHint: true,
              ),
            ),
            const SizedBox(height: 16),
            SizedBox(
              width: double.infinity,
              child: ElevatedButton(
                onPressed: _isSaving ? null : _handleCreate,
                child: _isSaving
                    ? const SizedBox(
                        height: 20,
                        width: 20,
                        child: CircularProgressIndicator(strokeWidth: 2, color: Colors.white),
                      )
                    : const Text('Créer'),
              ),
            ),
            const SizedBox(height: 16),
          ],
        ),
      ),
    );
  }
}
