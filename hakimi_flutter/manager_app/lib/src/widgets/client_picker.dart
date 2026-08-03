import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../providers/clients_providers.dart';

/// Searchable client selector. A plain dropdown forces staff to scroll every
/// client in the agency; here they type a name, a phone or a passport number
/// and pick the match.
class ClientPicker extends ConsumerStatefulWidget {
  final ClientModel? selected;
  final ValueChanged<ClientModel> onSelected;
  final VoidCallback? onCleared;

  const ClientPicker({
    super.key,
    required this.selected,
    required this.onSelected,
    this.onCleared,
  });

  @override
  ConsumerState<ClientPicker> createState() => _ClientPickerState();
}

class _ClientPickerState extends ConsumerState<ClientPicker> {
  final _searchController = TextEditingController();
  String _query = '';

  @override
  void dispose() {
    _searchController.dispose();
    super.dispose();
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final selected = widget.selected;

    if (selected != null) {
      return Card(
        margin: EdgeInsets.zero,
        child: ListTile(
          leading: CircleAvatar(
            child: Text(
              selected.fullName.isNotEmpty
                  ? selected.fullName[0].toUpperCase()
                  : '?',
            ),
          ),
          title: Text(selected.fullName),
          subtitle: Text(
            [
              selected.phoneNumber,
              if (selected.passportNumber.isNotEmpty) selected.passportNumber,
            ].join(' · '),
          ),
          trailing: IconButton(
            icon: const Icon(Icons.close),
            tooltip: 'Changer de client',
            onPressed: () {
              _searchController.clear();
              setState(() => _query = '');
              widget.onCleared?.call();
            },
          ),
        ),
      );
    }

    final clientsAsync = ref.watch(clientsProvider(_query.isEmpty ? null : _query));

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: _searchController,
          decoration: InputDecoration(
            labelText: 'Rechercher un client',
            hintText: 'Nom, téléphone ou passeport…',
            prefixIcon: const Icon(Icons.search),
            suffixIcon: _query.isEmpty
                ? null
                : IconButton(
                    icon: const Icon(Icons.clear),
                    onPressed: () {
                      _searchController.clear();
                      setState(() => _query = '');
                    },
                  ),
          ),
          onChanged: (v) => setState(() => _query = v.trim()),
        ),
        const SizedBox(height: 8),
        Container(
          constraints: const BoxConstraints(maxHeight: 260),
          decoration: BoxDecoration(
            border: Border.all(color: theme.dividerColor),
            borderRadius: BorderRadius.circular(8),
          ),
          child: clientsAsync.when(
            loading: () => const Padding(
              padding: EdgeInsets.symmetric(vertical: 24),
              child: Center(child: CircularProgressIndicator()),
            ),
            error: (e, _) => Padding(
              padding: const EdgeInsets.all(16),
              child: Text('Erreur: $e'),
            ),
            data: (clients) {
              if (clients.isEmpty) {
                return const Padding(
                  padding: EdgeInsets.all(16),
                  child: Text('Aucun client trouvé'),
                );
              }
              return ListView.builder(
                shrinkWrap: true,
                itemCount: clients.length,
                itemBuilder: (context, i) {
                  final c = clients[i];
                  return ListTile(
                    dense: true,
                    leading: CircleAvatar(
                      radius: 16,
                      child: Text(
                        c.fullName.isNotEmpty
                            ? c.fullName[0].toUpperCase()
                            : '?',
                        style: const TextStyle(fontSize: 12),
                      ),
                    ),
                    title: Text(c.fullName),
                    subtitle: Text(c.phoneNumber),
                    onTap: () {
                      FocusScope.of(context).unfocus();
                      widget.onSelected(c);
                    },
                  );
                },
              );
            },
          ),
        ),
      ],
    );
  }
}
