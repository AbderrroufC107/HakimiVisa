import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../constants/nationalities.dart';
import '../../providers/clients_providers.dart';
import '../../widgets/suggest_field.dart';

/// Edits an existing client. Mirrors [CreateClientScreen] field for field so
/// anything captured on creation can also be corrected here.
class EditClientScreen extends ConsumerStatefulWidget {
  final String clientId;

  const EditClientScreen({super.key, required this.clientId});

  @override
  ConsumerState<EditClientScreen> createState() => _EditClientScreenState();
}

class _EditClientScreenState extends ConsumerState<EditClientScreen> {
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
  bool _prefilled = false;

  @override
  void dispose() {
    _fullNameController.dispose();
    _phoneNumberController.dispose();
    _whatsappNumberController.dispose();
    _emailController.dispose();
    _passportNumberController.dispose();
    _nationalityController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  void _prefill(ClientModel client) {
    if (_prefilled) return;
    _prefilled = true;
    _fullNameController.text = client.fullName;
    _phoneNumberController.text = client.phoneNumber;
    _whatsappNumberController.text = client.whatsappNumber ?? '';
    _emailController.text = client.email ?? '';
    _passportNumberController.text = client.passportNumber;
    _nationalityController.text = client.nationality ?? '';
    _notesController.text = client.notes ?? '';
    _passportExpiry = client.passportExpiry;
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

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    String? orNull(TextEditingController c) =>
        c.text.trim().isEmpty ? null : c.text.trim();

    try {
      await ref.read(updateClientProvider((
        id: widget.clientId,
        data: {
          'fullName': _fullNameController.text.trim(),
          'phoneNumber': _phoneNumberController.text.trim(),
          'whatsappNumber': orNull(_whatsappNumberController),
          'email': orNull(_emailController),
          'passportNumber': orNull(_passportNumberController),
          'passportExpiry': _passportExpiry?.toIso8601String(),
          'nationality': orNull(_nationalityController),
          'notes': orNull(_notesController),
        },
      )).future);

      if (mounted) {
        context.showSuccess('Client mis à jour');
        ref.invalidate(clientsProvider(null));
        ref.invalidate(clientDetailProvider(widget.clientId));
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (_) {
      if (mounted) context.showError('Erreur lors de la mise à jour');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final clientAsync = ref.watch(clientDetailProvider(widget.clientId));

    return Scaffold(
      appBar: AppBar(title: const Text('Modifier le client')),
      body: clientAsync.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (e, _) => Center(
          child: Padding(
            padding: const EdgeInsets.all(24),
            child: Text('Erreur: $e', textAlign: TextAlign.center),
          ),
        ),
        data: (client) {
          if (client == null) {
            return const Center(child: Text('Client introuvable'));
          }
          _prefill(client);

          return SingleChildScrollView(
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
                  ),
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
                                onPressed: () =>
                                    setState(() => _passportExpiry = null),
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
          );
        },
      ),
    );
  }
}
