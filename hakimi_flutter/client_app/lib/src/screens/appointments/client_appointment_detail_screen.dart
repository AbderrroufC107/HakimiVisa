import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';
import 'package:go_router/go_router.dart';

class ClientAppointmentDetailScreen extends ConsumerWidget {
  final String appointmentId;

  const ClientAppointmentDetailScreen({
    super.key,
    required this.appointmentId,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = ref.watch(trackedPhoneProvider);
    final asyncAppointments = ref.watch(clientAppointmentsProvider(phone));

    return Scaffold(
      appBar: AppBar(title: const Text('Détail du rendez-vous')),
      body: asyncAppointments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(clientAppointmentsProvider(phone)),
        ),
        data: (appointments) {
          final appointment = appointments.where(
            (a) => a.id == appointmentId,
          ).firstOrNull;

          if (appointment == null) {
            return const EmptyState(
              icon: Icons.calendar_month_outlined,
              title: 'Rendez-vous introuvable',
            );
          }

          return SingleChildScrollView(
            padding: const EdgeInsets.all(AppSpacing.md),
            child: Column(
              crossAxisAlignment: CrossAxisAlignment.stretch,
              children: [
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      children: [
                        Container(
                          width: 72,
                          height: 72,
                          decoration: BoxDecoration(
                            color: context.colorScheme.primaryContainer,
                            shape: BoxShape.circle,
                          ),
                          child: Icon(
                            Icons.calendar_month,
                            size: 36,
                            color: context.colorScheme.onPrimaryContainer,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.md),
                        Text(
                          appointment.appointmentType.displayName,
                          style: context.textTheme.headlineSmall?.copyWith(
                            fontWeight: FontWeight.bold,
                          ),
                        ),
                        const SizedBox(height: AppSpacing.sm),
                        Text(
                          appointment.appointmentCenter,
                          style: context.textTheme.bodyLarge?.copyWith(
                            color: context.colorScheme.onSurfaceVariant,
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionHeader(title: 'Informations'),
                        const SizedBox(height: AppSpacing.sm),
                        _InfoRow(
                          icon: Icons.calendar_today_outlined,
                          label: 'Date',
                          value: appointment.appointmentDate.formatDate(
                            pattern: 'EEEE d MMMM yyyy',
                          ),
                        ),
                        _InfoRow(
                          icon: Icons.access_time,
                          label: 'Heure',
                          value: appointment.appointmentTime,
                        ),
                        _InfoRow(
                          icon: Icons.location_on_outlined,
                          label: 'Centre',
                          value: appointment.appointmentCenter,
                        ),
                        _InfoRow(
                          icon: Icons.category_outlined,
                          label: 'Type',
                          value: appointment.appointmentType.displayName,
                        ),
                        if (appointment.notes != null &&
                            appointment.notes!.isNotEmpty)
                          _InfoRow(
                            icon: Icons.notes_outlined,
                            label: 'Notes',
                            value: appointment.notes!,
                          ),
                      ],
                    ),
                  ),
                ),
                if (appointment.visaCase != null) ...[
                  const SizedBox(height: AppSpacing.md),
                  Card(
                    child: Padding(
                      padding: const EdgeInsets.all(AppSpacing.lg),
                      child: Column(
                        crossAxisAlignment: CrossAxisAlignment.start,
                        children: [
                          const SectionHeader(title: 'Dossier associé'),
                          const SizedBox(height: AppSpacing.sm),
                          _InfoRow(
                            icon: Icons.tag_outlined,
                            label: 'N° dossier',
                            value: appointment.visaCase!.caseNumber,
                          ),
                          _InfoRow(
                            icon: Icons.public_outlined,
                            label: 'Pays',
                            value: appointment.visaCase!.visaCountry,
                          ),
                          _InfoRow(
                            icon: Icons.category_outlined,
                            label: 'Type',
                            value: appointment.visaCase!.visaType,
                          ),
                        ],
                      ),
                    ),
                  ),
                ],
                const SizedBox(height: AppSpacing.md),
                Card(
                  child: Padding(
                    padding: const EdgeInsets.all(AppSpacing.lg),
                    child: Column(
                      crossAxisAlignment: CrossAxisAlignment.start,
                      children: [
                        const SectionHeader(title: 'Adresse'),
                        const SizedBox(height: AppSpacing.sm),
                        Container(
                          height: 150,
                          decoration: BoxDecoration(
                            color: context.colorScheme.surfaceContainerHighest,
                            borderRadius: BorderRadius.circular(
                              AppSpacing.borderRadiusMedium,
                            ),
                          ),
                          child: Center(
                            child: Column(
                              mainAxisAlignment: MainAxisAlignment.center,
                              children: [
                                Icon(
                                  Icons.map_outlined,
                                  size: 40,
                                  color: context.colorScheme.onSurfaceVariant,
                                ),
                                const SizedBox(height: AppSpacing.sm),
                                Text(
                                  appointment.appointmentCenter,
                                  style: context.textTheme.bodySmall?.copyWith(
                                    color: context.colorScheme.onSurfaceVariant,
                                  ),
                                ),
                              ],
                            ),
                          ),
                        ),
                      ],
                    ),
                  ),
                ),
                const SizedBox(height: AppSpacing.md),
                Row(
                  children: [
                    Expanded(
                      child: ElevatedButton.icon(
                        onPressed: () {
                          context.showSnackBar(
                            'Ajouté au calendrier',
                          );
                        },
                        icon: const Icon(Icons.add_alarm),
                        label: const Text('Ajouter au calendrier'),
                      ),
                    ),
                    const SizedBox(width: AppSpacing.sm),
                    Expanded(
                      child: OutlinedButton.icon(
                        onPressed: () => context.push('/contact'),
                        icon: const Icon(Icons.phone_outlined),
                        label: const Text('Contacter'),
                      ),
                    ),
                  ],
                ),
              ],
            ),
          );
        },
      ),
    );
  }
}

class _InfoRow extends StatelessWidget {
  final IconData icon;
  final String label;
  final String value;

  const _InfoRow({
    required this.icon,
    required this.label,
    required this.value,
  });

  @override
  Widget build(BuildContext context) {
    return Padding(
      padding: const EdgeInsets.symmetric(vertical: 6),
      child: Row(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, size: 18, color: context.colorScheme.onSurfaceVariant),
          const SizedBox(width: AppSpacing.sm),
          SizedBox(
            width: 80,
            child: Text(
              label,
              style: context.textTheme.bodySmall?.copyWith(
                color: context.colorScheme.onSurfaceVariant,
              ),
            ),
          ),
          Expanded(
            child: Text(
              value,
              style: context.textTheme.bodyMedium?.copyWith(
                fontWeight: FontWeight.w500,
              ),
            ),
          ),
        ],
      ),
    );
  }
}
