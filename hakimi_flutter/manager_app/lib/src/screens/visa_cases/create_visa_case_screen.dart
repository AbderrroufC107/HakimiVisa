import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';
import '../../providers/visa_cases_providers.dart';

class CreateVisaCaseScreen extends ConsumerStatefulWidget {
  const CreateVisaCaseScreen({super.key});

  @override
  ConsumerState<CreateVisaCaseScreen> createState() => _CreateVisaCaseScreenState();
}

class _CreateVisaCaseScreenState extends ConsumerState<CreateVisaCaseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _caseNumberController = TextEditingController();
  final _visaCountryController = TextEditingController();
  final _visaTypeController = TextEditingController();
  final _notesController = TextEditingController();
  
  String? _selectedClientId;
  bool _isSaving = false;

  @override
  void dispose() {
    _caseNumberController.dispose();
    _visaCountryController.dispose();
    _visaTypeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;
    if (_selectedClientId == null) {
      context.showError('Veuillez sélectionner un client');
      return;
    }

    setState(() => _isSaving = true);

    try {
      await ref.read(createVisaCaseProvider({
        'clientId': _selectedClientId,
        'caseNumber': _caseNumberController.text.trim(),
        'visaCountry': _visaCountryController.text.trim(),
        'visaType': _visaTypeController.text.trim(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      }).future);

      if (mounted) {
        context.showSuccess('Dossier visa créé avec succès');
        ref.invalidate(visaCasesProvider({}));
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
    final clientsAsync = ref.watch(clientsProvider(null));

    return Scaffold(
      appBar: AppBar(title: const Text('Nouveau dossier visa')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Client selector
              Text(
                'Sélectionner le client',
                style: Theme.of(context).textTheme.titleMedium,
              ),
              const SizedBox(height: 8),
              clientsAsync.when(
                data: (clients) => DropdownButtonFormField<String>(
                  initialValue: _selectedClientId,
                  decoration: const InputDecoration(
                    labelText: 'Client',
                    prefixIcon: Icon(Icons.person),
                    border: OutlineInputBorder(),
                  ),
                  items: clients.map((client) => DropdownMenuItem(
                    value: client.id,
                    child: Text(client.fullName),
                  )).toList(),
                  onChanged: (value) {
                    setState(() => _selectedClientId = value);
                  },
                  validator: (value) {
                    if (value == null || value.isEmpty) {
                      return 'Veuillez sélectionner un client';
                    }
                    return null;
                  },
                ),
                loading: () => const Center(child: CircularProgressIndicator()),
                error: (e, _) => Text('Erreur: $e'),
              ),
              const SizedBox(height: 16),
              
              // Case number
              TextFormField(
                controller: _caseNumberController,
                decoration: const InputDecoration(
                  labelText: 'Numéro de dossier',
                  prefixIcon: Icon(Icons.numbers),
                  hintText: 'Ex: VISA-2026-0001',
                ),
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              
              // Visa country
              TextFormField(
                controller: _visaCountryController,
                decoration: const InputDecoration(
                  labelText: 'Pays de destination',
                  prefixIcon: Icon(Icons.flag),
                  hintText: 'Ex: France, Espagne, Canada...',
                ),
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              
              // Visa type
              TextFormField(
                controller: _visaTypeController,
                decoration: const InputDecoration(
                  labelText: 'Type de visa',
                  prefixIcon: Icon(Icons.category),
                  hintText: 'Ex: Tourisme, Affaires, Études...',
                ),
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              
              // Notes
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
              
              // Save button
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
                      : const Text('Créer le dossier'),
                ),
              ),
            ],
          ),
        ),
      ),
    );
  }
}
