import 'package:flutter/material.dart';

/// A text field that filters an existing list as the user types, so staff pick
/// the value the agency already uses instead of retyping it. Anything not in
/// the list is still accepted and reported through [onCreate] so it can be
/// saved for next time.
class SuggestField extends StatefulWidget {
  final TextEditingController controller;
  final List<String> options;
  final String label;
  final String? hint;
  final IconData icon;
  final String? Function(String?)? validator;

  /// Called when the typed value is not already in [options].
  final Future<void> Function(String value)? onCreate;

  const SuggestField({
    super.key,
    required this.controller,
    required this.options,
    required this.label,
    required this.icon,
    this.hint,
    this.validator,
    this.onCreate,
  });

  @override
  State<SuggestField> createState() => _SuggestFieldState();
}

class _SuggestFieldState extends State<SuggestField> {
  final _focusNode = FocusNode();
  bool _open = false;

  @override
  void initState() {
    super.initState();
    _focusNode.addListener(() {
      if (!_focusNode.hasFocus) setState(() => _open = false);
    });
  }

  @override
  void dispose() {
    _focusNode.dispose();
    super.dispose();
  }

  List<String> get _matches {
    final q = widget.controller.text.trim().toLowerCase();
    if (q.isEmpty) return widget.options;
    return widget.options
        .where((o) => o.toLowerCase().contains(q))
        .toList(growable: false);
  }

  bool get _isNewValue {
    final q = widget.controller.text.trim();
    if (q.isEmpty) return false;
    return !widget.options.any((o) => o.toLowerCase() == q.toLowerCase());
  }

  Future<void> _create() async {
    final value = widget.controller.text.trim();
    if (value.isEmpty || widget.onCreate == null) return;
    await widget.onCreate!(value);
    if (mounted) setState(() => _open = false);
  }

  @override
  Widget build(BuildContext context) {
    final theme = Theme.of(context);
    final matches = _matches;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.stretch,
      children: [
        TextFormField(
          controller: widget.controller,
          focusNode: _focusNode,
          decoration: InputDecoration(
            labelText: widget.label,
            hintText: widget.hint,
            prefixIcon: Icon(widget.icon),
            suffixIcon: IconButton(
              icon: Icon(_open ? Icons.arrow_drop_up : Icons.arrow_drop_down),
              tooltip: 'Afficher la liste',
              onPressed: () => setState(() => _open = !_open),
            ),
          ),
          validator: widget.validator,
          onChanged: (_) => setState(() => _open = true),
          onTap: () => setState(() => _open = true),
        ),
        if (_open) ...[
          const SizedBox(height: 4),
          Container(
            constraints: const BoxConstraints(maxHeight: 220),
            decoration: BoxDecoration(
              border: Border.all(color: theme.dividerColor),
              borderRadius: BorderRadius.circular(8),
              color: theme.colorScheme.surface,
            ),
            child: ListView(
              shrinkWrap: true,
              padding: EdgeInsets.zero,
              children: [
                for (final option in matches)
                  ListTile(
                    dense: true,
                    title: Text(option),
                    onTap: () {
                      widget.controller.text = option;
                      setState(() => _open = false);
                      FocusScope.of(context).unfocus();
                    },
                  ),
                if (matches.isEmpty && !_isNewValue)
                  const ListTile(
                    dense: true,
                    title: Text('Aucun résultat'),
                  ),
                if (_isNewValue && widget.onCreate != null)
                  ListTile(
                    dense: true,
                    leading: const Icon(Icons.add_circle_outline),
                    title: Text('Ajouter « ${widget.controller.text.trim()} »'),
                    onTap: _create,
                  ),
              ],
            ),
          ),
        ],
      ],
    );
  }
}
