import 'dart:async';

import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../constants/nationalities.dart';
import '../../providers/clients_providers.dart';
import '../../widgets/suggest_field.dart';

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
  final _nationalityController = TextEditingController();
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
    final probe = phone.length >= 4 ? phone : (name.length >= 3 ? name : '');
    _duplicateDebounce?.cancel();
    _duplicateDebounce = Timer(const Duration(milliseconds: 400), () {
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
    _nationalityController.dispose();
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
        'nationality': _nationalityController.text.trim().isEmpty
            ? null
            : _nationalityController.text.trim(),
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
              SuggestField(
                controller: _nationalityController,
                options: kNationalities,
                label: 'Nationalité',
                icon: Icons.flag,
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

/// Shows clients already on file that match what is being typed, so a client
/// the agency forgot about is reused instead of duplicated.
class _DuplicateHint extends ConsumerWidget {
  final String query;

  const _DuplicateHint({required this.query});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    if (query.isEmpty) return const SizedBox.shrink();

    final matches = ref.watch(clientsProvider(query)).valueOrNull ?? const [];
    if (matches.isEmpty) return const SizedBox.shrink();

    final theme = Theme.of(context);
    return Container(
      margin: const EdgeInsets.only(top: 8),
      padding: const EdgeInsets.all(12),
      decoration: BoxDecoration(
        color: Colors.amber.withValues(alpha: 0.12),
        border: Border.all(color: Colors.amber.withValues(alpha: 0.5)),
        borderRadius: BorderRadius.circular(8),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              const Icon(Icons.info_outline, size: 18, color: Colors.orange),
              const SizedBox(width: 8),
              Expanded(
                child: Text(
                  'Client déjà existant ?',
                  style: theme.textTheme.bodyMedium
                      ?.copyWith(fontWeight: FontWeight.w600),
                ),
              ),
            ],
          ),
          const SizedBox(height: 6),
          for (final c in matches.take(4))
            InkWell(
              onTap: () => context.push('/clients/${c.id}'),
              child: Padding(
                padding: const EdgeInsets.symmetric(vertical: 6),
                child: Row(
                  children: [
                    Expanded(
                      child: Text(
                        '${c.fullName} · ${c.phoneNumber}',
                        style: theme.textTheme.bodySmall,
                      ),
                    ),
                    const Icon(Icons.chevron_right, size: 16),
                  ],
                ),
              ),
            ),
        ],
      ),
    );
  }
}
