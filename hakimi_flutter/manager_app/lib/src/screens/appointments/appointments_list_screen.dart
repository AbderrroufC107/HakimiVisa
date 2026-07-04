import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/appointments_providers.dart';

class AppointmentsListScreen extends ConsumerStatefulWidget {
  const AppointmentsListScreen({super.key});

  @override
  ConsumerState<AppointmentsListScreen> createState() =>
      _AppointmentsListScreenState();
}

class _AppointmentsListScreenState
    extends ConsumerState<AppointmentsListScreen> {
  String _dateFilter = 'today';

  Map<String, dynamic> _buildFilters() {
    final now = DateTime.now();
    final today = DateTime(now.year, now.month, now.day);

    switch (_dateFilter) {
      case 'today':
        return {
          'start_date': today.toIso8601String(),
          'end_date': today.add(const Duration(days: 1)).toIso8601String(),
        };
      case 'week':
        final endOfWeek = today.add(const Duration(days: 7));
        return {
          'start_date': today.toIso8601String(),
          'end_date': endOfWeek.toIso8601String(),
        };
      case 'month':
        final endOfMonth = DateTime(now.year, now.month + 1, 0);
        return {
          'start_date': today.toIso8601String(),
          'end_date': endOfMonth.toIso8601String(),
        };
      default:
        return {};
    }
  }

  @override
  Widget build(BuildContext context) {
    final filters = _buildFilters();
    final appointmentsAsync = ref.watch(appointmentsProvider(filters));
    final theme = Theme.of(context);

    return Stack(
      children: [
        Column(
          children: [
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 16, 16, 8),
              child: SingleChildScrollView(
                scrollDirection: Axis.horizontal,
                child: Row(
                  children: [
                    _DateFilterChip(
                      label: "Aujourd'hui",
                      selected: _dateFilter == 'today',
                      onSelected: () => setState(() => _dateFilter = 'today'),
                    ),
                    const SizedBox(width: 8),
                    _DateFilterChip(
                      label: 'Cette semaine',
                      selected: _dateFilter == 'week',
                      onSelected: () => setState(() => _dateFilter = 'week'),
                    ),
                    const SizedBox(width: 8),
                    _DateFilterChip(
                      label: 'Ce mois',
                      selected: _dateFilter == 'month',
                      onSelected: () => setState(() => _dateFilter = 'month'),
                    ),
                    const SizedBox(width: 8),
                    _DateFilterChip(
                      label: 'Tous',
                      selected: _dateFilter == 'all',
                      onSelected: () => setState(() => _dateFilter = 'all'),
                    ),
                  ],
                ),
              ),
            ),
            Expanded(
              child: RefreshIndicator(
                onRefresh: () async {
                  ref.invalidate(appointmentsProvider(filters));
                },
                child: appointmentsAsync.when(
                  data: (appointments) {
                    if (appointments.isEmpty) {
                      return const EmptyState(
                        icon: Icons.event_busy,
                        title: 'Aucun rendez-vous',
                        subtitle: 'Aucun rendez-vous pour cette période',
                      );
                    }
                    return ListView.builder(
                      padding: const EdgeInsets.symmetric(horizontal: 16),
                      itemCount: appointments.length,
                      itemBuilder: (context, index) {
                        final appt = appointments[index];
                        return AppCard(
                          margin: const EdgeInsets.only(bottom: 8),
                          onTap: () {
                            if (appt.visaCase != null) {
                              context.push('/visa-cases/${appt.visaCaseId}');
                            }
                          },
                          child: Row(
                            children: [
                              Container(
                                padding: const EdgeInsets.all(8),
                                decoration: BoxDecoration(
                                  color: appt.appointmentType == AppointmentType.tls
                                      ? const Color(0xFF3B82F6).withValues(alpha: 0.12)
                                      : appt.appointmentType == AppointmentType.vfs
                                          ? const Color(0xFF10B981).withValues(alpha: 0.12)
                                          : const Color(0xFF8B5CF6).withValues(alpha: 0.12),
                                  borderRadius: BorderRadius.circular(8),
                                ),
                                child: Column(
                                  children: [
                                    Text(
                                      appt.appointmentDate.formatDate(pattern: 'dd'),
                                      style: theme.textTheme.titleMedium?.copyWith(
                                        fontWeight: FontWeight.bold,
                                        color: appt.appointmentType == AppointmentType.tls
                                            ? const Color(0xFF3B82F6)
                                            : appt.appointmentType == AppointmentType.vfs
                                                ? const Color(0xFF10B981)
                                                : const Color(0xFF8B5CF6),
                                      ),
                                    ),
                                    Text(
                                      appt.appointmentDate.formatDate(pattern: 'MMM'),
                                      style: theme.textTheme.labelSmall?.copyWith(
                                        color: appt.appointmentType == AppointmentType.tls
                                            ? const Color(0xFF3B82F6)
                                            : appt.appointmentType == AppointmentType.vfs
                                                ? const Color(0xFF10B981)
                                                : const Color(0xFF8B5CF6),
                                      ),
                                    ),
                                  ],
                                ),
                              ),
                              const SizedBox(width: 12),
                              Expanded(
                                child: Column(
                                  crossAxisAlignment: CrossAxisAlignment.start,
                                  children: [
                                    Text(
                                      '${appt.appointmentTime} - ${appt.appointmentCenter}',
                                      style: theme.textTheme.bodyMedium?.copyWith(
                                        fontWeight: FontWeight.w600,
                                      ),
                                    ),
                                    const SizedBox(height: 2),
                                    Text(
                                      appt.appointmentType.displayName,
                                      style: theme.textTheme.bodySmall,
                                    ),
                                    if (appt.visaCase != null) ...[
                                      const SizedBox(height: 2),
                                      Text(
                                        appt.visaCase!.caseNumber,
                                        style: theme.textTheme.labelSmall?.copyWith(
                                          color: theme.colorScheme.onSurfaceVariant,
                                        ),
                                      ),
                                    ],
                                  ],
                                ),
                              ),
                              if (appt.visaCase != null)
                                StatusBadge(
                                  status: appt.visaCase!.currentStatus,
                                  fontSize: 10,
                                ),
                            ],
                          ),
                        );
                      },
                    );
                  },
                  error: (e, _) => AppErrorWidget(
                    message: e.toString(),
                    onRetry: () =>
                        ref.invalidate(appointmentsProvider(filters)),
                  ),
                  loading: () =>
                      const Center(child: CircularProgressIndicator()),
                ),
              ),
            ),
          ],
        ),
        Positioned(
          bottom: 16,
          right: 16,
          child: FloatingActionButton(
            onPressed: () => context.push('/appointments/new'),
            child: const Icon(Icons.add),
          ),
        ),
      ],
    );
  }
}

class _DateFilterChip extends StatelessWidget {
  final String label;
  final bool selected;
  final VoidCallback onSelected;

  const _DateFilterChip({
    required this.label,
    required this.selected,
    required this.onSelected,
  });

  @override
  Widget build(BuildContext context) {
    return FilterChip(
      label: Text(label),
      selected: selected,
      onSelected: (_) => onSelected(),
      selectedColor:
          Theme.of(context).colorScheme.primary.withValues(alpha: 0.15),
      checkmarkColor: Theme.of(context).colorScheme.primary,
    );
  }
}
