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
  final _nationalityController = TextEditingController();
  final _notesController = TextEditingController();
  bool _isSaving = false;

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
        'passportNumber': _passportNumberController.text.trim(),
        'nationality': _nationalityController.text.trim(),
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
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _nationalityController,
                decoration: const InputDecoration(
                  labelText: 'Nationalité',
                  prefixIcon: Icon(Icons.flag),
                ),
                validator: AppValidators.required,
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
