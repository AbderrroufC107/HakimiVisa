import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/appointments_providers.dart';
import '../../providers/visa_cases_providers.dart';

class EditAppointmentScreen extends ConsumerStatefulWidget {
  final String appointmentId;
  final AppointmentModel? initial;

  const EditAppointmentScreen({
    super.key,
    required this.appointmentId,
    this.initial,
  });

  @override
  ConsumerState<EditAppointmentScreen> createState() =>
      _EditAppointmentScreenState();
}

class _EditAppointmentScreenState
    extends ConsumerState<EditAppointmentScreen> {
  final _formKey = GlobalKey<FormState>();
  final _caseIdController = TextEditingController();
  final _centerController = TextEditingController();
  final _notesController = TextEditingController();
  late DateTime _selectedDate;
  late TimeOfDay _selectedTime;
  AppointmentType _selectedType = AppointmentType.tls;
  bool _isSaving = false;

  @override
  void initState() {
    super.initState();
    final appt = widget.initial;
    _caseIdController.text = appt?.visaCaseId ?? '';
    _centerController.text = appt?.appointmentCenter ?? '';
    _notesController.text = appt?.notes ?? '';
    _selectedDate = appt?.appointmentDate ?? DateTime.now();
    _selectedTime = _parseTime(appt?.appointmentTime);
    _selectedType = appt?.appointmentType ?? AppointmentType.tls;
  }

  TimeOfDay _parseTime(String? value) {
    if (value == null) return TimeOfDay.now();
    final parts = value.split(':');
    if (parts.length != 2) return TimeOfDay.now();
    return TimeOfDay(
      hour: int.tryParse(parts[0]) ?? 0,
      minute: int.tryParse(parts[1]) ?? 0,
    );
  }

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
      await ref.read(updateAppointmentProvider((
        id: widget.appointmentId,
        data: {
          'visaCaseId': _caseIdController.text.trim(),
          'appointmentDate': _selectedDate.toIso8601String(),
          'appointmentTime':
              '${_selectedTime.hour.toString().padLeft(2, '0')}:${_selectedTime.minute.toString().padLeft(2, '0')}',
          'appointmentCenter': _centerController.text.trim(),
          'appointmentType': _selectedType.toJson(),
          'notes': _notesController.text.trim().isEmpty
              ? null
              : _notesController.text.trim(),
        },
      )).future);

      if (mounted) {
        context.showSuccess('Rendez-vous mis à jour');
        ref.invalidate(appointmentsProvider);
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
    return Scaffold(
      appBar: AppBar(title: const Text('Modifier le rendez-vous')),
      body: SingleChildScrollView(
        padding: const EdgeInsets.all(16),
        child: Form(
          key: _formKey,
          child: Column(
            crossAxisAlignment: CrossAxisAlignment.start,
            children: [
              // Pick the case from the real list — nobody can type a raw id.
              ref.watch(visaCasesProvider(const {})).when(
                    loading: () => const Padding(
                      padding: EdgeInsets.symmetric(vertical: 16),
                      child: Center(child: CircularProgressIndicator()),
                    ),
                    error: (e, _) => Text('Erreur: $e'),
                    data: (cases) => DropdownButtonFormField<String>(
                      initialValue: cases.any((c) => c.id == _caseIdController.text)
                          ? _caseIdController.text
                          : null,
                      isExpanded: true,
                      decoration: const InputDecoration(
                        labelText: 'Dossier visa',
                        prefixIcon: Icon(Icons.folder),
                      ),
                      items: [
                        for (final c in cases)
                          if (c.id != null)
                            DropdownMenuItem(
                              value: c.id,
                              child: Text(
                                '${c.caseNumber} · ${c.visaCountry} - ${c.visaType}',
                                overflow: TextOverflow.ellipsis,
                              ),
                            ),
                      ],
                      onChanged: (value) =>
                          setState(() => _caseIdController.text = value ?? ''),
                      validator: (value) => (value == null || value.isEmpty)
                          ? 'Veuillez sélectionner un dossier'
                          : null,
                    ),
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
