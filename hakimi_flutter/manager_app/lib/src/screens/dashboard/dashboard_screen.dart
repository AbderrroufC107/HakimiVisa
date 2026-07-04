import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';
import '../../providers/appointments_providers.dart';

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final statsAsync = ref.watch(dashboardStatsProvider);
    final analyticsAsync = ref.watch(analyticsProvider);
    final clientsAsync = ref.watch(clientsProvider(null));
    final theme = Theme.of(context);
    final l10n = context.l10n;

    return RefreshIndicator(
      onRefresh: () async {
        ref.invalidate(dashboardStatsProvider);
        ref.invalidate(analyticsProvider);
        ref.invalidate(clientsProvider(null));
      },
      child: SingleChildScrollView(
        physics: const AlwaysScrollableScrollPhysics(),
        padding: const EdgeInsets.all(16),
        child: Column(
          crossAxisAlignment: CrossAxisAlignment.start,
          children: [
            statsAsync.when(
              data: (stats) => _buildSummaryCards(context, stats),
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.invalidate(dashboardStatsProvider),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 24),
            analyticsAsync.when(
              data: (analytics) => _buildCharts(context, analytics, theme),
              error: (e, _) => const SizedBox(),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 24),
            SectionHeader(title: l10n.translate('recentClients')),
            const SizedBox(height: 8),
            clientsAsync.when(
              data: (clients) {
                final recent = clients.take(5).toList();
                if (recent.isEmpty) {
                  return EmptyState(
                    icon: Icons.people_outline,
                    title: l10n.translate('noClient'),
                  );
                }
                return Column(
                  children: recent
                      .map((c) => _buildClientTile(context, c))
                      .toList(),
                );
              },
              error: (e, _) => AppErrorWidget(message: e.toString()),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 24),
            SectionHeader(title: l10n.translate('upcomingAppointments')),
            const SizedBox(height: 8),
            _buildUpcomingAppointments(context, ref),
          ],
        ),
      ),
    );
  }

  Widget _buildSummaryCards(BuildContext context, DashboardStats stats) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          context.l10n.dashboard,
          style: Theme.of(
            context,
          ).textTheme.headlineSmall?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 16),
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: context.l10n.clients,
                value: '${stats.totalClients}',
                icon: Icons.people,
                color: const Color(0xFF3B82F6),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: context.l10n.translate('cases'),
                value: '${stats.totalCases}',
                icon: Icons.folder,
                color: const Color(0xFF8B5CF6),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: context.l10n.translate('pending'),
                value: '${stats.enAttente}',
                icon: Icons.pending,
                color: const Color(0xFFF59E0B),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: 'Visa OK',
                value: '${stats.visaOk}',
                icon: Icons.check_circle,
                color: const Color(0xFF10B981),
              ),
            ),
          ],
        ),
        const SizedBox(height: 8),
        Row(
          children: [
            Expanded(
              child: _SummaryCard(
                title: context.l10n.translate('refused'),
                value: '${stats.refuse}',
                icon: Icons.cancel,
                color: const Color(0xFFEF4444),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: 'RDV OK',
                value: '${stats.rdvOk}',
                icon: Icons.calendar_today,
                color: const Color(0xFF06B6D4),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildCharts(
    BuildContext context,
    Analytics analytics,
    ThemeData theme,
  ) {
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SectionHeader(title: context.l10n.analytics),
        const SizedBox(height: 16),
        if (analytics.applicationsPerMonth.isNotEmpty) ...[
          SizedBox(
            height: 200,
            child: _buildLineChart(analytics.applicationsPerMonth),
          ),
        ],
        const SizedBox(height: 16),
        if (analytics.statusDistribution.isNotEmpty) ...[
          SizedBox(
            height: 200,
            child: _buildPieChart(analytics.statusDistribution),
          ),
        ],
      ],
    );
  }

  Widget _buildLineChart(List<Map<String, dynamic>> data) {
    final spots = data.asMap().entries.map((entry) {
      return FlSpot(
        entry.key.toDouble(),
        (entry.value['count'] as num?)?.toDouble() ?? 0,
      );
    }).toList();

    return LineChart(
      LineChartData(
        gridData: const FlGridData(show: false),
        titlesData: const FlTitlesData(show: false),
        borderData: FlBorderData(show: false),
        lineBarsData: [
          LineChartBarData(
            spots: spots,
            isCurved: true,
            color: const Color(0xFF1A237E),
            barWidth: 3,
            dotData: const FlDotData(show: true),
            belowBarData: BarAreaData(
              show: true,
              color: const Color(0xFF1A237E).withValues(alpha: 0.1),
            ),
          ),
        ],
      ),
    );
  }

  Widget _buildPieChart(List<Map<String, dynamic>> data) {
    final colors = [
      const Color(0xFFF59E0B),
      const Color(0xFF3B82F6),
      const Color(0xFF8B5CF6),
      const Color(0xFF10B981),
      const Color(0xFFEF4444),
    ];

    return PieChart(
      PieChartData(
        sections: data.asMap().entries.map((entry) {
          final count = (entry.value['count'] as num?)?.toDouble() ?? 0;
          return PieChartSectionData(
            value: count,
            color: colors[entry.key % colors.length],
            title: '$count',
            radius: 40,
            titleStyle: const TextStyle(
              color: Colors.white,
              fontWeight: FontWeight.bold,
              fontSize: 12,
            ),
          );
        }).toList(),
        centerSpaceRadius: 40,
      ),
    );
  }

  Widget _buildClientTile(BuildContext context, ClientModel client) {
    return AppCard(
      margin: const EdgeInsets.only(bottom: 8),
      onTap: () => context.push('/clients/${client.id}'),
      child: ListTile(
        leading: AvatarWidget(
          initials: client.fullName.isNotEmpty ? client.fullName[0] : '?',
          size: 40,
        ),
        title: Text(client.fullName),
        subtitle: Text(client.passportNumber),
        trailing: const Icon(Icons.chevron_right),
      ),
    );
  }

  Widget _buildUpcomingAppointments(BuildContext context, WidgetRef ref) {
    final today = DateTime.now();
    final startOfDay = DateTime(today.year, today.month, today.day);
    final endOfWeek = startOfDay.add(const Duration(days: 7));

    final appointmentsAsync = ref.watch(
      appointmentsProvider({
        'start_date': startOfDay.toIso8601String(),
        'end_date': endOfWeek.toIso8601String(),
      }),
    );

    return appointmentsAsync.when(
      data: (appts) {
        if (appts.isEmpty) {
          return EmptyState(
            icon: Icons.event_busy,
            title: context.l10n.translate('noUpcomingAppointment'),
          );
        }
        return Column(
          children: appts
              .take(5)
              .map(
                (a) => AppCard(
                  margin: const EdgeInsets.only(bottom: 8),
                  child: ListTile(
                    leading: CircleAvatar(
                      backgroundColor: a.appointmentType.color.withValues(
                        alpha: 0.12,
                      ),
                      child: Icon(
                        Icons.calendar_today,
                        color: a.appointmentType.color,
                        size: 20,
                      ),
                    ),
                    title: Text(
                      '${a.appointmentDate.formatDate()} à ${a.appointmentTime}',
                    ),
                    subtitle: Text(
                      '${a.appointmentCenter} - ${a.appointmentType.displayName}',
                    ),
                  ),
                ),
              )
              .toList(),
        );
      },
      error: (e, _) => const SizedBox(),
      loading: () => const Center(child: CircularProgressIndicator()),
    );
  }
}

class _SummaryCard extends StatelessWidget {
  final String title;
  final String value;
  final IconData icon;
  final Color color;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
  });

  @override
  Widget build(BuildContext context) {
    return AppCard(
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Icon(icon, color: color, size: 24),
          const SizedBox(height: 8),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.bold,
              color: color,
            ),
          ),
          const SizedBox(height: 4),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
            ),
          ),
        ],
      ),
    );
  }
}

extension on AppointmentType {
  Color get color {
    switch (this) {
      case AppointmentType.tls:
        return const Color(0xFF3B82F6);
      case AppointmentType.vfs:
        return const Color(0xFF10B981);
      case AppointmentType.embassy:
        return const Color(0xFF8B5CF6);
      case AppointmentType.biometrics:
        return const Color(0xFFF59E0B);
      case AppointmentType.interview:
        return const Color(0xFF06B6D4);
      case AppointmentType.other:
        return const Color(0xFF6B7280);
    }
  }
}
