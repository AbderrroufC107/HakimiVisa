import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';

class ClientsListScreen extends ConsumerStatefulWidget {
  const ClientsListScreen({super.key});

  @override
  ConsumerState<ClientsListScreen> createState() => _ClientsListScreenState();
}

class _ClientsListScreenState extends ConsumerState<ClientsListScreen> {
  String _searchQuery = '';
  String _filter = 'all';

  @override
  Widget build(BuildContext context) {
    final clientsAsync = ref.watch(
      clientsProvider(_searchQuery.isNotEmpty ? _searchQuery : null),
    );
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return Scaffold(
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 0),
            child: SearchField(
              hintText: l10n.translate('searchClient'),
              onChanged: (value) => setState(() => _searchQuery = value),
            ),
          ),
          const SizedBox(height: 8),
          SizedBox(
            height: 40,
            child: ListView(
              scrollDirection: Axis.horizontal,
              padding: const EdgeInsets.symmetric(horizontal: 16),
              children: [
                _FilterChip(
                  label: l10n.all,
                  selected: _filter == 'all',
                  onSelected: () => setState(() => _filter = 'all'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: l10n.translate('recent'),
                  selected: _filter == 'recent',
                  onSelected: () => setState(() => _filter = 'recent'),
                ),
                const SizedBox(width: 8),
                _FilterChip(
                  label: l10n.translate('withVisas'),
                  selected: _filter == 'with_visas',
                  onSelected: () => setState(() => _filter = 'with_visas'),
                ),
              ],
            ),
          ),
          const SizedBox(height: 8),
          Expanded(
            child: RefreshIndicator(
              onRefresh: () async {
                ref.invalidate(clientsProvider(null));
              },
              child: clientsAsync.when(
                data: (clients) {
                  if (clients.isEmpty) {
                    return EmptyState(
                      icon: Icons.people_outline,
                      title: l10n.translate('noClient'),
                      subtitle: l10n.translate('addFirstClient'),
                    );
                  }
                  return ListView.builder(
                    padding: const EdgeInsets.symmetric(horizontal: 16),
                    itemCount: clients.length,
                    itemBuilder: (context, index) {
                      final client = clients[index];
                      return AppCard(
                        margin: const EdgeInsets.only(bottom: 8),
                        onTap: () => context.push('/clients/${client.id}'),
                        child: Row(
                          children: [
                            AvatarWidget(
                              initials: client.fullName.isNotEmpty
                                  ? client.fullName[0]
                                  : '?',
                              size: 44,
                            ),
                            const SizedBox(width: 12),
                            Expanded(
                              child: Column(
                                crossAxisAlignment: CrossAxisAlignment.start,
                                children: [
                                  Text(
                                    client.fullName,
                                    style: theme.textTheme.titleMedium
                                        ?.copyWith(fontWeight: FontWeight.w600),
                                  ),
                                  const SizedBox(height: 2),
                                  Text(
                                    '${client.phoneNumber} | ${client.passportNumber}',
                                    style: theme.textTheme.bodySmall?.copyWith(
                                      color: theme.colorScheme.onSurfaceVariant,
                                    ),
                                  ),
                                ],
                              ),
                            ),
                            if (client.visaCases != null &&
                                client.visaCases!.isNotEmpty)
                              Container(
                                padding: const EdgeInsets.symmetric(
                                  horizontal: 8,
                                  vertical: 2,
                                ),
                                decoration: BoxDecoration(
                                  color: const Color(
                                    0xFF10B981,
                                  ).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(12),
                                ),
                                child: Text(
                                  '${client.visaCases!.length}',
                                  style: const TextStyle(
                                    color: Color(0xFF10B981),
                                    fontWeight: FontWeight.w600,
                                    fontSize: 12,
                                  ),
                                ),
                              ),
                            const SizedBox(width: 4),
                            const Icon(Icons.chevron_right, size: 20),
                          ],
                        ),
                      );
                    },
                  );
                },
                error: (e, _) => AppErrorWidget(
                  message: e.toString(),
                  onRetry: () => ref.invalidate(clientsProvider(null)),
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
              ),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/clients/new'),
        child: const Icon(Icons.add),
      ),
    );
  }
}

class _FilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _FilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor: Theme.of(
        context,
      ).colorScheme.primary.withValues(alpha: 0.15),
      checkmarkColor: Theme.of(context).colorScheme.primary,
    );
  }
}
