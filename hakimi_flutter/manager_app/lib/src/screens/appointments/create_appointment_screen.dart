import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/appointments_providers.dart';

class CreateAppointmentScreen extends ConsumerStatefulWidget {
  const CreateAppointmentScreen({super.key});

  @override
  ConsumerState<CreateAppointmentScreen> createState() =>
      _CreateAppointmentScreenState();
}

class _CreateAppointmentScreenState
    extends ConsumerState<CreateAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _caseIdController = TextEditingController();
  final _centerController = TextEditingController();
  final _notesController = TextEditingController();
  DateTime _selectedDate = DateTime.now();
  TimeOfDay _selectedTime = TimeOfDay.now();
  AppointmentType _selectedType = AppointmentType.tls;
  bool _isSaving = false;

  @override
  void dispose() {
    _caseIdController.dispose();
    _centerController.dispose();
    _notesController.dispose();
    super.dispose();
  }

  Future<void> _pickDate() async {
    final date = await showDatePicker(
      context: context,
      initialDate: _selectedDate,
      firstDate: DateTime.now().subtract(const Duration(days: 30)),
      lastDate: DateTime.now().add(const Duration(days: 365)),
    );
    if (date != null) setState(() => _selectedDate = date);
  }

  Future<void> _pickTime() async {
    final time = await showTimePicker(
      context: context,
      initialTime: _selectedTime,
    );
    if (time != null) setState(() => _selectedTime = time);
  }

  Future<void> _handleSave() async {
    if (!_formKey.currentState!.validate()) return;

    setState(() => _isSaving = true);

    try {
      await ref.read(createAppointmentProvider({
        'visa_case_id': _caseIdController.text.trim(),
        'appointment_date': _selectedDate.toIso8601String(),
        'appointment_time':
            '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
        'appointment_center': _centerController.text.trim(),
        'appointment_type': _selectedType.toJson(),
        'notes': _notesController.text.trim().isEmpty
            ? null
            : _notesController.text.trim(),
      }).future);

      if (mounted) {
        context.showSuccess('Rendez-vous créé avec succès');
        ref.invalidate(appointmentsProvider({}));
        context.pop();
      }
    } on ApiException catch (e) {
      if (mounted) context.showError(e.message);
    } catch (e) {
      if (mounted) context.showError('Erreur lors de la création');
    } finally {
      if (mounted) setState(() => _isSaving = false);
    }
  }

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(title: const Text('Nouveau rendez-vous')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              TextFormField(
                controller: _caseIdController,
                decoration: const InputDecoration(
                  labelText: 'ID du dossier visa',
                  prefixIcon: Icon(Icons.folder),
                ),
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _pickDate,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Date du rendez-vous',
                    prefixIcon: Icon(Icons.calendar_today),
                  ),
                  child: Text(_selectedDate.formatDate()),
                ),
              ),
              const SizedBox(height: 16),
              InkWell(
                onTap: _pickTime,
                child: InputDecorator(
                  decoration: const InputDecoration(
                    labelText: 'Heure du rendez-vous',
                    prefixIcon: Icon(Icons.access_time),
                  ),
                  child: Text(
                    '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
                  ),
                ),
              ),
              const SizedBox(height: 16),
              TextFormField(
                controller: _centerController,
                decoration: const InputDecoration(
                  labelText: 'Centre',
                  prefixIcon: Icon(Icons.location_on),
                ),
                validator: AppValidators.required,
              ),
              const SizedBox(height: 16),
              DropdownButtonFormField<AppointmentType>(
                initialValue: _selectedType,
                decoration: const InputDecoration(
                  labelText: 'Type de rendez-vous',
                  prefixIcon: Icon(Icons.category),
                ),
                items: AppointmentType.values.map((type) {
                  return DropdownMenuItem(
                    value: type,
                    child: Text(type.displayName),
                  );
                }).toList(),
                onChanged: (v) {
                  if (v != null) setState(() => _selectedType = v);
                },
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
