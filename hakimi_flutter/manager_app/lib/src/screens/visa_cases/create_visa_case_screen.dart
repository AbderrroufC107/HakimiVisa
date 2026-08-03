import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/ref_data_providers.dart';
import '../../providers/visa_cases_providers.dart';
import '../../widgets/client_picker.dart';
import '../../widgets/suggest_field.dart';

class CreateVisaCaseScreen extends ConsumerStatefulWidget {
  const CreateVisaCaseScreen({super.key});

  @override
  ConsumerState<CreateVisaCaseScreen> createState() => _CreateVisaCaseScreenState();
}

class _CreateVisaCaseScreenState extends ConsumerState<CreateVisaCaseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _visaCountryController = TextEditingController();
  final _visaTypeController = TextEditingController();
  final _notesController = TextEditingController();
  
  String? _selectedClientId;
  ClientModel? _selectedClient;
  bool _isSaving = false;

  @override
  void dispose() {
    _visaCountryController.dispose();
    _visaTypeController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _addCountry(String value) async {
    try {
      await ref.read(addCountryProvider(value).future);
      ref.invalidate(countriesProvider);
      if (!mounted) return;
      context.showSuccess('Pays ajouté');
    } catch (_) {
      if (!mounted) return;
      context.showError("Erreur lors de l'ajout du pays");
    }
  }

  Future<void> _addVisaType(String value) async {
    try {
      await ref.read(addVisaTypeProvider(value).future);
      ref.invalidate(visaTypesProvider);
      if (!mounted) return;
      context.showSuccess('Type ajouté');
    } catch (_) {
      if (!mounted) return;
      context.showError("Erreur lors de l'ajout du type");
    }
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
        'visaCountry': _visaCountryController.text.trim(),
        'visaType': _visaTypeController.text.trim(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      }).future);

      if (mounted) {
        context.showSuccess('Dossier visa créé avec succès');
        ref.invalidate(visaCasesProvider);
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
    final countries = ref.watch(countriesProvider).valueOrNull ?? const <String>[];
    final visaTypes = ref.watch(visaTypesProvider).valueOrNull ?? const <String>[];

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
              ClientPicker(
                selected: _selectedClient,
                onSelected: (client) => setState(() {
                  _selectedClient = client;
                  _selectedClientId = client.id;
                }),
                onCleared: () => setState(() {
                  _selectedClient = null;
                  _selectedClientId = null;
                }),
              ),
              const SizedBox(height: 16),

              // Visa country — suggested from what the agency already uses
              SuggestField(
                controller: _visaCountryController,
                options: countries,
                label: 'Pays de destination',
                hint: 'Ex: France, Espagne, Canada...',
                icon: Icons.flag,
                validator: AppValidators.required,
                onCreate: _addCountry,
              ),
              const SizedBox(height: 16),

              // Visa type
              SuggestField(
                controller: _visaTypeController,
                options: visaTypes,
                label: 'Type de visa',
                hint: 'Ex: Tourisme, Affaires, Études...',
                icon: Icons.category,
                validator: AppValidators.required,
                onCreate: _addVisaType,
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
