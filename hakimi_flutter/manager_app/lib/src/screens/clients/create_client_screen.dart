import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';

class CreateClientScreen extends ConsumerStatefulWidget {
  const CreateClientScreen({super.key});

  @override
  ConsumerState<CreateClientScreen> createState() => _CreateClientScreenState();
}

class _CreateClientScreenState extends ConsumerState<CreateClientScreen> {
  final _formKey = GlobalKey<FormState>();
  final _fullNameController = TextEditingController();
  final _phoneNumberController = TextEditingController();
  final _whatsappNumberController = TextEditingController();
  final _emailController = TextEditingController();
  final _passportNumberController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime? _passportExpiry;
  bool _isSaving = false;

  /// Debounced lookup so an existing client surfaces while typing, instead of
  /// being created a second time.
  String _duplicateQuery = '';
  Timer? _duplicateDebounce;

  void _onIdentityChanged(String _) {
    final name = _fullNameController.text.trim();
    final phone = _phoneNumberController.text.trim();
    // From the very first letter: the point is to catch the duplicate before
    // the agent has typed the whole name, not after.
    final probe = phone.length >= 3 ? phone : (name.isNotEmpty ? name : '');
    _duplicateDebounce?.cancel();
    _duplicateDebounce = Timer(const Duration(milliseconds: 180), () {
      if (mounted && probe != _duplicateQuery) {
        setState(() => _duplicateQuery = probe);
      }
    });
  }

  String _formatDate(DateTime d) =>
      '${d.day.toString().padLeft(2, '0')}/${d.month.toString().padLeft(2, '0')}/${d.year}';

  Future<void> _pickPassportExpiry() async {
    final now = DateTime.now();
    final picked = await showDatePicker(
      context: context,
      initialDate: _passportExpiry ?? DateTime(now.year + 1, now.month, now.day),
      firstDate: DateTime(now.year - 20),
      lastDate: DateTime(now.year + 30),
    );
    if (picked != null) setState(() => _passportExpiry = picked);
  }

  @override
  void dispose() {
    _duplicateDebounce?.cancel();
    _fullNameController.dispose();
    _phoneNumberController.dispose();
    _whatsappNumberController.dispose();
    _emailController.dispose();
    _passportNumberController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      await ref.read(createClientProvider({
        'fullName': _fullNameController.text.trim(),
        'phoneNumber': _phoneNumberController.text.trim(),
        'whatsappNumber': _whatsappNumberController.text.trim().isEmpty
            ? null
            : _whatsappNumberController.text.trim(),
        'email': _emailController.text.trim().isEmpty
            ? null
            : _emailController.text.trim(),
        'passportNumber': _passportNumberController.text.trim().isEmpty
            ? null
            : _passportNumberController.text.trim(),
        'passportExpiry': _passportExpiry?.toIso8601String(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      }).future);

      if (mounted) {
        context.showSuccess('Client créé avec succès');
        ref.invalidate(clientsProvider(null));
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) {
        context.showError(e.message);
      }
    } catch (e) {
      if (mounted) {
        context.showError('Erreur lors de la création');
      }
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nouveau client')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            children: [
              TextFormField(
                controller: _fullNameController,
                decoration: const InputDecoration(
                  labelText: 'Nom complet',
                  prefixIcon: Icon(Icons.person),
                ),
                validator: AppValidators.required,
                onChanged: _onIdentityChanged,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _phoneNumberController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Numéro de téléphone',
                  prefixIcon: Icon(Icons.phone),
                ),
                validator: AppValidators.required,
                onChanged: _onIdentityChanged,
              ),
              _DuplicateHint(query: _duplicateQuery),
              const SizedBox(height: 16),
              TextFormField(
                controller: _whatsappNumberController,
                keyboardType: TextInputType.phone,
                decoration: const InputDecoration(
                  labelText: 'Numéro WhatsApp',
                  prefixIcon: Icon(Icons.chat),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _emailController,
                keyboardType: TextInputType.emailAddress,
                decoration: const InputDecoration(
                  labelText: 'Email',
                  prefixIcon: Icon(Icons.email),
                ),
                validator: AppValidators.email,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _passportNumberController,
                decoration: const InputDecoration(
                  labelText: 'Numéro de passeport',
                  prefixIcon: Icon(Icons.credit_card),
                ),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _pickPassportExpiry,
                borderRadius: BorderRadius.circular(4),
                child: InputDecorator(
                  decoration: InputDecoration(
                    labelText: 'Date d\'expiration du passeport',
                    prefixIcon: const Icon(Icons.event),
                    suffixIcon: _passportExpiry == null
                        ? null
                        : IconButton(
                            icon: const Icon(Icons.clear),
                            onPressed: () => setState(() => _passportExpiry = null),
                            tooltip: 'Effacer',
                          ),
                  ),
                  child: Text(
                    _passportExpiry == null
                        ? 'jj/mm/aaaa'
                        : _formatDate(_passportExpiry!),
                    style: _passportExpiry == null
                        ? TextStyle(color: Theme.of(context).hintColor)
                        : null,
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _notesController,
                maxLines: 3,
                decoration: const InputDecoration(
                  labelText: 'Notes',
                  prefixIcon: Icon(Icons.note),
                  alignLabelWithHint: true,
                ),
              ),
              const SizedBox(height: 24),
              SizedBox(
                width: double.infinity,
                height: 50,
                child: ElevatedButton(
                  onPressed: _isSaving ? null : _handleSave,
                  child: _isSaving
                      ? const SizedBox(
                          height: 20,
                          width: 20,
                          child: CircularProgressIndicator(
                            strokeWidth: 2,
                            color: Colors.white,
                          ),
                        )
                      : const Text('Enregistrer'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}

/// Live lookup while the agent types: existing clients appear as a list to
/// tap, and an explicit "nouveau" line confirms the name is genuinely new
/// rather than leaving silence to be read either way.
class _DuplicateHint extends ConsumerWidget {
  final String query;

  const _DuplicateHint({required this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (query.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    final async = ref.watch(clientsProvider(query));
    final matches = async.valueOrNull;

    // Keep the previous list on screen while the next one loads so the panel
    // does not flicker on every keystroke.
    if (matches == null) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: theme.colorScheme.surfaceContainerHighest.withValues(alpha: 0.4),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const SizedBox(
              height: 14,
              width: 14,
              child: CircularProgressIndicator(strokeWidth: 2),
            ),
            const SizedBox(width: 10),
            Text('Recherche...', style: theme.textTheme.bodySmall),
          ],
        ),
      );
    }

    if (matches.isEmpty) {
      return Container(
        margin: const EdgeInsets.only(top: 8),
        padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 10),
        decoration: BoxDecoration(
          color: Colors.green.withValues(alpha: 0.10),
          border: Border.all(color: Colors.green.withValues(alpha: 0.4)),
          borderRadius: BorderRadius.circular(8),
        ),
        child: Row(
          children: [
            const Icon(Icons.person_add_alt_1, size: 18, color: Colors.green),
            const SizedBox(width: 8),
            Expanded(
              child: Text(
                'Nouveau client — aucun dossier existant',
                style: theme.textTheme.bodySmall?.copyWith(
                  color: Colors.green.shade800,
                  fontWeight: FontWeight.w600,
                ),
              ),
            ),
          ],
        ),
      );
    }

    return Container(
      margin: const EdgeInsets.only(top: 8),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.10),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Padding(
            padding: const EdgeInsets.fromLTRB(12, 10, 12, 6),
            child: Row(
              children: [
                const Icon(Icons.info_outline, size: 18, color: Colors.orange),
                const SizedBox(width: 8),
                Expanded(
                  child: Text(
                    '${matches.length} client(s) déjà au fichier',
                    style: theme.textTheme.bodyMedium
                        ?.copyWith(fontWeight: FontWeight.w600),
                  ),
                ),
              ],
            ),
          ),
          for (final c in matches.take(5))
            InkWell(
              onTap: () => context.push('/clients/${c.id}'),
              child: Padding(
                padding: const EdgeInsets.symmetric(horizontal: 12, vertical: 8),
                child: Row(
                  children: [
                    CircleAvatar(
                      radius: 13,
                      backgroundColor: theme.colorScheme.primary.withValues(alpha: 0.12),
                      child: Text(
                        c.fullName.isNotEmpty ? c.fullName[0].toUpperCase() : '?',
                        style: theme.textTheme.labelSmall?.copyWith(
                          color: theme.colorScheme.primary,
                          fontWeight: FontWeight.w700,
                        ),
                      ),
                    ),
                    const SizedBox(width: 10),
                    Expanded(
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          Text(
                            c.fullName,
                            maxLines: 1,
                            overflow: TextOverflow.ellipsis,
                            style: theme.textTheme.bodyMedium
                                ?.copyWith(fontWeight: FontWeight.w600),
                          ),
                          Text(c.phoneNumber, style: theme.textTheme.bodySmall),
                        ],
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 18),
                  ],
                ),
              ),
            ),
          const SizedBox(height: 6),
        ],
      ),
    );
  }
}
