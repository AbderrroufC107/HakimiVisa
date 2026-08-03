import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';
import '../../providers/visa_cases_providers.dart';

/// One search box over both clients and cases: staff type a name, a phone, a
/// passport or a case number and see the client together with their dossiers
/// and each dossier's status.
class GlobalSearchScreen extends ConsumerStatefulWidget {
  final String? initialQuery;

  const GlobalSearchScreen({super.key, this.initialQuery});

  @override
  ConsumerState<GlobalSearchScreen> createState() => _GlobalSearchScreenState();
}

class _GlobalSearchScreenState extends ConsumerState<GlobalSearchScreen> {
  late final TextEditingController _controller =
      TextEditingController(text: widget.initialQuery ?? '');
  String _query = '';
  Timer? _debounce;

  /// visaCasesProvider is keyed by a Map, and Dart maps compare by identity —
  /// building a fresh one every frame would spawn a new provider each rebuild
  /// and loop the request forever. Keep one instance per query instead.
  Map<String, dynamic> _caseFilters = const {};

  @override
  void initState() {
    super.initState();
    _query = (widget.initialQuery ?? '').trim();
    _caseFilters = _query.isEmpty ? const {} : {'search': _query};
  }

  void _setQuery(String value) {
    setState(() {
      _query = value;
      _caseFilters = value.isEmpty ? const {} : {'search': value};
    });
  }

  @override
  void dispose() {
    _debounce?.cancel();
    _controller.dispose();
    super.dispose();
  }

  void _onChanged(String value) {
    _debounce?.cancel();
    _debounce = Timer(const Duration(milliseconds: 350), () {
      if (mounted) _setQuery(value.trim());
    });
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final hasQuery = _query.isNotEmpty;

    final clientsAsync = ref.watch(clientsProvider(hasQuery ? _query : null));
    final casesAsync = ref.watch(visaCasesProvider(_caseFilters));

    return Scaffold(
      appBar: AppBar(
        title: TextField(
          controller: _controller,
          autofocus: widget.initialQuery == null,
          decoration: const InputDecoration(
            hintText: 'Nom, téléphone, passeport ou N° dossier…',
            border: InputBorder.none,
            hintStyle: TextStyle(color: Colors.black45),
          ),
          style: const TextStyle(color: Colors.black87),
          cursorColor: Colors.black87,
          onChanged: _onChanged,
        ),
        actions: [
          if (_controller.text.isNotEmpty)
            IconButton(
              icon: const Icon(Icons.clear),
              onPressed: () {
                _controller.clear();
                _setQuery('');
              },
            ),
        ],
      ),
      body: !hasQuery
          ? const _Hint()
          : ListView(
              padding: const EdgeInsets.all(12),
              children: [
                _SectionHeader(
                  icon: Icons.people_outline,
                  label: 'Clients',
                  count: clientsAsync.valueOrNull?.length,
                ),
                clientsAsync.when(
                  loading: () => const _Loading(),
                  error: (e, _) => _ErrorRow('$e'),
                  data: (clients) => clients.isEmpty
                      ? const _EmptyRow('Aucun client')
                      : Column(
                          children: [
                            for (final c in clients)
                              Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  leading: CircleAvatar(
                                    child: Text(
                                      c.fullName.isNotEmpty
                                          ? c.fullName[0].toUpperCase()
                                          : '?',
                                    ),
                                  ),
                                  title: Text(c.fullName),
                                  subtitle: Text(c.phoneNumber),
                                  trailing: const Icon(Icons.chevron_right),
                                  onTap: () => context.push('/clients/${c.id}'),
                                ),
                              ),
                          ],
                        ),
                ),
                const SizedBox(height: 16),
                _SectionHeader(
                  icon: Icons.folder_outlined,
                  label: 'Dossiers visa',
                  count: casesAsync.valueOrNull?.length,
                ),
                casesAsync.when(
                  loading: () => const _Loading(),
                  error: (e, _) => _ErrorRow('$e'),
                  data: (cases) => cases.isEmpty
                      ? const _EmptyRow('Aucun dossier')
                      : Column(
                          children: [
                            for (final vc in cases)
                              Card(
                                margin: const EdgeInsets.only(bottom: 8),
                                child: ListTile(
                                  title: Text(
                                    vc.caseNumber,
                                    style: const TextStyle(
                                      fontWeight: FontWeight.w600,
                                    ),
                                  ),
                                  subtitle: Text(
                                    [
                                      if (vc.client is Map &&
                                          (vc.client as Map)['fullName'] != null)
                                        (vc.client as Map)['fullName'] as String,
                                      '${vc.visaCountry} - ${vc.visaType}',
                                    ].join('\n'),
                                  ),
                                  isThreeLine: vc.client is Map,
                                  trailing: _StatusChip(status: vc.currentStatus),
                                  onTap: vc.id == null
                                      ? null
                                      : () => context.push('/visa-cases/${vc.id}'),
                                ),
                              ),
                          ],
                        ),
                ),
                const SizedBox(height: 24),
                Center(
                  child: Text(
                    'Recherche par nom, téléphone, passeport ou numéro de dossier',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                    textAlign: TextAlign.center,
                  ),
                ),
              ],
            ),
    );
  }
}

class _SectionHeader extends StatelessWidget {
  final IconData icon;
  final String label;
  final int? count;

  const _SectionHeader({required this.icon, required this.label, this.count});

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Padding(
      padding: const EdgeInsets.only(bottom: 8, top: 4),
      child: Row(
        children: [
          Icon(icon, size: 18, color: theme.colorScheme.onSurfaceVariant),
          const SizedBox(width: 8),
          Text(
            label,
            style: theme.textTheme.titleSmall?.copyWith(
              fontWeight: FontWeight.w700,
            ),
          ),
          if (count != null) ...[
            const SizedBox(width: 6),
            Text(
              '($count)',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
            ),
          ],
        ],
      ),
    );
  }
}

class _StatusChip extends StatelessWidget {
  final VisaStatus status;

  const _StatusChip({required this.status});

  @override
  Widget build(BuildContext context) {
    final color = status.color;
    return Container(
      padding: const EdgeInsets.symmetric(horizontal: 8, vertical: 4),
      decoration: BoxDecoration(
        color: color.withValues(alpha: 0.12),
        borderRadius: BorderRadius.circular(999),
        border: Border.all(color: color.withValues(alpha: 0.4)),
      ),
      child: Text(
        status.displayName,
        style: TextStyle(color: color, fontSize: 11, fontWeight: FontWeight.w600),
      ),
    );
  }
}

class _Loading extends StatelessWidget {
  const _Loading();

  @override
  Widget build(BuildContext context) => const Padding(
        padding: EdgeInsets.symmetric(vertical: 20),
        child: Center(child: CircularProgressIndicator()),
      );
}

class _EmptyRow extends StatelessWidget {
  final String text;
  const _EmptyRow(this.text);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text(
          text,
          style: TextStyle(color: Theme.of(context).colorScheme.onSurfaceVariant),
        ),
      );
}

class _ErrorRow extends StatelessWidget {
  final String message;
  const _ErrorRow(this.message);

  @override
  Widget build(BuildContext context) => Padding(
        padding: const EdgeInsets.symmetric(vertical: 12),
        child: Text('Erreur: $message'),
      );
}

class _Hint extends StatelessWidget {
  const _Hint();

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    return Center(
      child: Padding(
        padding: const EdgeInsets.all(32),
        child: Column(
          mainAxisSize: MainAxisSize.min,
          children: [
            Icon(Icons.search, size: 56, color: theme.colorScheme.onSurfaceVariant),
            const SizedBox(height: 12),
            Text(
              'Rechercher un client ou un dossier',
              style: theme.textTheme.titleMedium,
              textAlign: TextAlign.center,
            ),
            const SizedBox(height: 6),
            Text(
              'Tapez un nom, un téléphone, un passeport ou un numéro de dossier',
              style: theme.textTheme.bodySmall?.copyWith(
                color: theme.colorScheme.onSurfaceVariant,
              ),
              textAlign: TextAlign.center,
            ),
          ],
        ),
      ),
    );
  }
}
