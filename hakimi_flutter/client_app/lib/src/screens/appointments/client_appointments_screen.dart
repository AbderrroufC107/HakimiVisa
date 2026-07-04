import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/tracking_providers.dart';

class ClientAppointmentsScreen extends ConsumerWidget {
  const ClientAppointmentsScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final phone = ref.watch(trackedPhoneProvider);
    final asyncAppointments = ref.watch(clientAppointmentsProvider(phone));

    return Scaffold(
      appBar: AppBar(title: const Text('Rendez-vous')),
      body: asyncAppointments.when(
        loading: () => const Center(child: CircularProgressIndicator()),
        error: (error, stack) => AppErrorWidget(
          message: error.toString(),
          onRetry: () => ref.invalidate(clientAppointmentsProvider(phone)),
        ),
        data: (appointments) {
          if (phone.isEmpty) {
            return const EmptyState(
              icon: Icons.phone_outlined,
              title: 'Recherchez d\'abord',
              subtitle: 'Entrez votre numéro de téléphone pour voir vos rendez-vous.',
            );
          }
          if (appointments.isEmpty) {
            return const EmptyState(
              icon: Icons.calendar_month_outlined,
              title: 'Aucun rendez-vous',
              subtitle: 'Vous n\'avez aucun rendez-vous planifié.',
            );
          }

          final now = DateTime.now();
          final upcoming = appointments
              .where((a) => a.appointmentDate.isAfter(now) ||
                  a.appointmentDate.isAtSameMomentAs(now))
              .toList()
            ..sort((a, b) => a.appointmentDate.compareTo(b.appointmentDate));

          final past = appointments
              .where((a) => a.appointmentDate.isBefore(now))
              .toList()
            ..sort((a, b) => b.appointmentDate.compareTo(a.appointmentDate));

          return RefreshIndicator(
            onRefresh: () => ref.refresh(clientAppointmentsProvider(phone).future),
            child: ListView(
              padding: const EdgeInsets.all(AppSpacing.md),
              children: [
                if (upcoming.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: Text(
                      'À venir',
                      style: context.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ...upcoming.map((a) => _AppointmentCard(appointment: a)),
                  const SizedBox(height: AppSpacing.md),
                ],
                if (past.isNotEmpty) ...[
                  Padding(
                    padding: const EdgeInsets.only(bottom: AppSpacing.sm),
                    child: Text(
                      'Passés',
                      style: context.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.w600,
                      ),
                    ),
                  ),
                  ...past.map((a) => _AppointmentCard(appointment: a)),
                ],
              ],
            ),
          );
        },
      ),
    );
  }
}

class _AppointmentCard extends StatelessWidget {
  final AppointmentModel appointment;

  const _AppointmentCard({required this.appointment});

  @override
  Widget build(BuildContext context) {
    final theme = context.theme;

    return Padding(
      padding: const EdgeInsets.only(bottom: AppSpacing.sm),
      child: AppCard(
        onTap: () => context.push('/appointments/${appointment.id}'),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            Row(
              children: [
                Container(
                  padding: const EdgeInsets.all(AppSpacing.sm),
                  decoration: BoxDecoration(
                    color: theme.colorScheme.primaryContainer,
                    borderRadius: BorderRadius.circular(AppSpacing.borderRadiusSmall),
                  ),
                  child: Icon(
                    Icons.calendar_today,
                    size: 20,
                    color: theme.colorScheme.onPrimaryContainer,
                  ),
                ),
                const SizedBox(width: AppSpacing.sm),
                Expanded(
                  child: Column(
                    crossAxisAlignment: CrossAxisAlignment.start,
                    children: [
                      Text(
                        appointment.appointmentType.displayName,
                        style: theme.textTheme.titleSmall?.copyWith(
                          fontWeight: FontWeight.w600,
                        ),
                      ),
                      Text(
                        appointment.appointmentCenter,
                        style: theme.textTheme.bodySmall?.copyWith(
                          color: theme.colorScheme.onSurfaceVariant,
                        ),
                      ),
                    ],
                  ),
                ),
              ],
            ),
            const SizedBox(height: AppSpacing.sm),
            Row(
              children: [
                Icon(Icons.calendar_today_outlined,
                    size: 14, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  appointment.appointmentDate.formatDate(),
                  style: theme.textTheme.bodySmall,
                ),
                const SizedBox(width: AppSpacing.md),
                Icon(Icons.access_time,
                    size: 14, color: theme.colorScheme.onSurfaceVariant),
                const SizedBox(width: 4),
                Text(
                  appointment.appointmentTime,
                  style: theme.textTheme.bodySmall,
                ),
              ],
            ),
            if (appointment.visaCase != null) ...[
              const SizedBox(height: 4),
              Row(
                children: [
                  Icon(Icons.tag_outlined,
                      size: 14, color: theme.colorScheme.onSurfaceVariant),
                  const SizedBox(width: 4),
                  Text(
                    appointment.visaCase!.caseNumber,
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.primary,
                    ),
                  ),
                ],
              ),
            ],
          ],
        ),
      ),
    );
  }
}
