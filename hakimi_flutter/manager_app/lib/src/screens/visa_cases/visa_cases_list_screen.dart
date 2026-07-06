import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/visa_cases_providers.dart';

class VisaCasesListScreen extends ConsumerStatefulWidget {
  const VisaCasesListScreen({super.key});

  @override
  ConsumerState<VisaCasesListScreen> createState() => _VisaCasesListScreenState();
}

class _VisaCasesListScreenState extends ConsumerState<VisaCasesListScreen> {
  String _searchQuery = '';

  @override
  Widget build(BuildContext context) {
    final casesAsync = ref.watch(visaCasesProvider({}));
    final theme = Theme.of(context);

    return Scaffold(
      appBar: AppBar(
        title: const Text('Dossiers Visa'),
        actions: [
          IconButton(
            icon: const Icon(Icons.add),
            onPressed: () => context.push('/visa-cases/new'),
          ),
        ],
      ),
      body: Column(
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
            child: SearchField(
              hintText: 'Rechercher un dossier...',
              onChanged: (v) => setState(() => _searchQuery = v),
            ),
          ),
          Expanded(
            child: casesAsync.when(
              data: (cases) {
                final filtered = cases.where((c) {
                  final query = _searchQuery.toLowerCase();
                  return c.caseNumber.toLowerCase().contains(query) ||
                      c.visaCountry.toLowerCase().contains(query) ||
                      c.visaType.toLowerCase().contains(query);
                }).toList();

                if (filtered.isEmpty) {
                  return const EmptyState(
                    icon: Icons.folder_off,
                    title: 'Aucun dossier',
                    subtitle: 'Créez un nouveau dossier visa',
                  );
                }

                return RefreshIndicator(
                  onRefresh: () async => ref.invalidate(visaCasesProvider({})),
                  child: ListView.builder(
                    padding: const EdgeInsets.all(16),
                    itemCount: filtered.length,
                    itemBuilder: (context, index) {
                      final vc = filtered[index];
                      return _buildCaseCard(vc, theme);
                    },
                  ),
                );
              },
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.invalidate(visaCasesProvider({})),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
          ),
        ],
      ),
      floatingActionButton: FloatingActionButton(
        onPressed: () => context.push('/visa-cases/new'),
        child: const Icon(Icons.add),
      ),
    );
  }

  Widget _buildCaseCard(VisaCaseModel vc, ThemeData theme) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () => context.push('/visa-cases/${vc.id}'),
      child: Row(
        children: [
          Container(
            width: 12,
            height: 12,
            decoration: BoxDecoration(
              color: vc.currentStatus.color,
              shape: BoxShape.circle,
            ),
          ),
          const SizedBox(width: 12),
          Expanded(
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.start,
              children: [
                Text(
                  vc.caseNumber,
                  style: theme.textTheme.titleSmall?.copyWith(
                    fontWeight: FontWeight.w600,
                  ),
                ),
                const SizedBox(height: 4),
                Text(
                  '${vc.visaCountry} - ${vc.visaType}',
                  style: theme.textTheme.bodySmall?.copyWith(
                    color: theme.colorScheme.onSurfaceVariant,
                  ),
                ),
              ],
            ),
          ),
          StatusBadge(status: vc.currentStatus),
        ],
      ),
    );
  }
}
