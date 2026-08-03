import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/ref_data_providers.dart';
import '../../providers/visa_cases_providers.dart';
import '../../widgets/suggest_field.dart';

class EditVisaCaseScreen extends ConsumerStatefulWidget {
  final String caseId;

  const EditVisaCaseScreen({super.key, required this.caseId});

  @override
  ConsumerState<EditVisaCaseScreen> createState() =>
      _EditVisaCaseScreenState();
}

class _EditVisaCaseScreenState extends ConsumerState<EditVisaCaseScreen> {
  final _formKey = GlobalKey<FormState>();
  final _visaCountryController = TextEditingController();
  final _visaTypeController = TextEditingController();
  final _notesController = TextEditingController();
  final _priceController = TextEditingController();
  bool _isPaid = false;
  bool _isSaving = false;
  bool _didPopulate = false;

  @override
  void dispose() {
    _visaCountryController.dispose();
    _visaTypeController.dispose();
    _notesController.dispose();
    _priceController.dispose();
    super.dispose();
  }

  void _populate(VisaCaseModel vc) {
    _visaCountryController.text = vc.visaCountry;
    _visaTypeController.text = vc.visaType;
    _notesController.text = vc.notes ?? '';
    _isPaid = vc.isPaid;
    if (vc.price != null) {
      _priceController.text = vc.price!.toString();
    }
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      final data = <String, dynamic>{
        'visaCountry': _visaCountryController.text.trim(),
        'visaType': _visaTypeController.text.trim(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
        'price': _priceController.text.trim().isEmpty
            ? null
            : double.tryParse(_priceController.text.trim()),
        'isPaid': _isPaid,
      };

      await ref.read(updateVisaCaseProvider((
        id: widget.caseId,
        data: data,
      )).future);

      if (mounted) {
        context.showSuccess('Dossier visa mis à jour');
        ref.invalidate(visaCaseDetailProvider(widget.caseId));
        ref.invalidate(visaCasesProvider);
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (e) {
      if (mounted) context.showError('Erreur lors de la mise à jour');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    final caseAsync = ref.watch(visaCaseDetailProvider(widget.caseId));
    if (!_didPopulate) {
      caseAsync.whenOrNull(data: (vc) {
        if (vc == null) return;
        _didPopulate = true;
        WidgetsBinding.instance.addPostFrameCallback((_) {
          if (!mounted) return;
          _populate(vc);
          setState(() {});
        });
      });
    }

    return Scaffold(
      appBar: AppBar(title: const Text('Modifier le dossier visa')),
      body: caseAsync.when(
        data: (vc) {
          if (vc == null) {
            return const EmptyState(
              icon: Icons.folder_off,
              title: 'Dossier introuvable',
            );
          }
          return SingleChildScrollView(
            padding: const EdgeInsets.all(16),
            child: Form(
              key: _formKey,
              child: Column(
                crossAxisAlignment: CrossAxisAlignment.start,
                children: [
                  SuggestField(
                    controller: _visaCountryController,
                    options: ref.watch(countriesProvider).valueOrNull ??
                        const <String>[],
                    label: 'Pays de destination',
                    icon: Icons.flag,
                    validator: AppValidators.required,
                  ),
                  const SizedBox(height: 16),
                  SuggestField(
                    controller: _visaTypeController,
                    options: ref.watch(visaTypesProvider).valueOrNull ??
                        const <String>[],
                    label: 'Type de visa',
                    icon: Icons.category,
                    validator: AppValidators.required,
                  ),
                  const SizedBox(height: 16),
                  TextFormField(
                    controller: _priceController,
                    keyboardType: TextInputType.number,
                    decoration: const InputDecoration(
                      labelText: 'Prix',
                      prefixIcon: Icon(Icons.payments),
                    ),
                  ),
                  const SizedBox(height: 8),
                  SwitchListTile(
                    value: _isPaid,
                    onChanged: (v) => setState(() => _isPaid = v),
                    title: const Text('Payé'),
                    subtitle: const Text('Le client a déjà payé'),
                    contentPadding: EdgeInsets.zero,
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
        error: (e, _) => AppErrorWidget(
          message: e.toString(),
          onRetry: () =>
              ref.invalidate(visaCaseDetailProvider(widget.caseId)),
        ),
        loading: () => const Center(child: CircularProgressIndicator()),
      ),
    );
  }
}
