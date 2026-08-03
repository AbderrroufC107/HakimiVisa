import 'package:flutter/material.dart';
import 'package:flutter_riverpod/flutter_riverpod.dart';
import 'package:go_router/go_router.dart';
import 'package:fl_chart/fl_chart.dart';
import 'package:hakimi_shared/shared.dart';
import '../../providers/clients_providers.dart';
import '../../providers/appointments_providers.dart';
import '../../providers/visa_cases_providers.dart';

enum DashboardPeriod { today, week, month, custom }

/// Period the dashboard reports on. Opens on today, as the office cares most
/// about what came in during the current day.
final dashboardPeriodProvider = StateProvider<DashboardPeriod>(
  (ref) => DashboardPeriod.today,
);

/// Only set once the user picks explicit bounds via the calendar.
final dashboardCustomRangeProvider = StateProvider<DateRange?>((ref) => null);

/// Resolves the selected preset into the concrete window sent to the API.
final dashboardRangeProvider = Provider<DateRange>((ref) {
  final period = ref.watch(dashboardPeriodProvider);
  final custom = ref.watch(dashboardCustomRangeProvider);
  final now = DateTime.now();
  final startOfToday = DateTime(now.year, now.month, now.day);
  final endOfToday = DateTime(now.year, now.month, now.day, 23, 59, 59, 999);

  switch (period) {
    case DashboardPeriod.today:
      return (from: startOfToday, to: endOfToday);
    case DashboardPeriod.week:
      return (
        from: startOfToday.subtract(const Duration(days: 6)),
        to: endOfToday,
      );
    case DashboardPeriod.month:
      return (from: DateTime(now.year, now.month), to: endOfToday);
    case DashboardPeriod.custom:
      return custom ?? (from: startOfToday, to: endOfToday);
  }
});

class DashboardScreen extends ConsumerWidget {
  const DashboardScreen({super.key});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final range = ref.watch(dashboardRangeProvider);
    final statsAsync = ref.watch(dashboardStatsProvider(range));
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
            _PeriodSelector(range: range),
            const SizedBox(height: 16),
            statsAsync.when(
              data: (stats) => _buildSummaryCards(context, stats, range),
              error: (e, _) => AppErrorWidget(
                message: e.toString(),
                onRetry: () => ref.invalidate(dashboardStatsProvider(range)),
              ),
              loading: () => const Center(child: CircularProgressIndicator()),
            ),
            const SizedBox(height: 20),
            _buildQuickActions(context),
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

  Widget _buildQuickActions(BuildContext context) {
    final l10n = context.l10n;
    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        Text(
          l10n.translate('quickActions'),
          style: Theme.of(
            context,
          ).textTheme.titleMedium?.copyWith(fontWeight: FontWeight.bold),
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _QuickAction(
                icon: Icons.person_add_alt_1,
                label: l10n.translate('newClient'),
                color: const Color(0xFF2563EB),
                onTap: () => context.push('/clients/new'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _QuickAction(
                icon: Icons.create_new_folder_outlined,
                label: l10n.translate('newCase'),
                color: const Color(0xFF7C3AED),
                onTap: () => context.push('/visa-cases/new'),
              ),
            ),
          ],
        ),
        const SizedBox(height: 10),
        Row(
          children: [
            Expanded(
              child: _QuickAction(
                icon: Icons.folder_open_outlined,
                label: l10n.visaCases,
                color: const Color(0xFF0891B2),
                onTap: () => context.go('/visa-cases'),
              ),
            ),
            const SizedBox(width: 10),
            Expanded(
              child: _QuickAction(
                icon: Icons.notifications_active_outlined,
                label: l10n.notifications,
                color: const Color(0xFFEA580C),
                onTap: () => context.push('/notifications'),
              ),
            ),
          ],
        ),
      ],
    );
  }

  Widget _buildSummaryCards(
    BuildContext context,
    DashboardStats stats,
    DateRange range,
  ) {
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
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: context.l10n.clients,
                  color: const Color(0xFF3B82F6),
                  kind: _BreakdownKind.clients,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: context.l10n.translate('cases'),
                value: '${stats.totalCases}',
                icon: Icons.folder,
                color: const Color(0xFF8B5CF6),
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: context.l10n.translate('cases'),
                  color: const Color(0xFF8B5CF6),
                  kind: _BreakdownKind.cases,
                ),
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
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: context.l10n.translate('pending'),
                  color: const Color(0xFFF59E0B),
                  kind: _BreakdownKind.cases,
                  status: VisaStatus.enAttente,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: 'Visa OK',
                value: '${stats.visaOk}',
                icon: Icons.check_circle,
                color: const Color(0xFF10B981),
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: 'Visa OK',
                  color: const Color(0xFF10B981),
                  kind: _BreakdownKind.cases,
                  status: VisaStatus.visaOk,
                ),
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
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: context.l10n.translate('refused'),
                  color: const Color(0xFFEF4444),
                  kind: _BreakdownKind.cases,
                  status: VisaStatus.visaRefusee,
                ),
              ),
            ),
            const SizedBox(width: 8),
            Expanded(
              child: _SummaryCard(
                title: 'RDV OK',
                value: '${stats.rdvOk}',
                icon: Icons.calendar_today,
                color: const Color(0xFF06B6D4),
                onTap: () => _openBreakdown(
                  context,
                  range: range,
                  title: 'RDV OK',
                  color: const Color(0xFF06B6D4),
                  kind: _BreakdownKind.cases,
                  status: VisaStatus.rdvOk,
                ),
              ),
            ),
          ],
        ),
      ],
    );
  }

  void _openBreakdown(
    BuildContext context, {
    required DateRange range,
    required String title,
    required Color color,
    required _BreakdownKind kind,
    VisaStatus? status,
  }) {
    showModalBottomSheet<void>(
      context: context,
      isScrollControlled: true,
      backgroundColor: Colors.transparent,
      builder: (_) => _BreakdownSheet(
        range: range,
        title: title,
        color: color,
        kind: kind,
        status: status,
      ),
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
      appointmentsProvider((dateFrom: startOfDay, dateTo: endOfWeek)),
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
  final VoidCallback? onTap;

  const _SummaryCard({
    required this.title,
    required this.value,
    required this.icon,
    required this.color,
    this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return InkWell(
      onTap: onTap,
      borderRadius: BorderRadius.circular(16),
      child: Container(
      padding: const EdgeInsets.all(14),
      decoration: BoxDecoration(
        gradient: LinearGradient(
          colors: [color.withValues(alpha: 0.12), color.withValues(alpha: 0.05)],
          begin: Alignment.topLeft,
          end: Alignment.bottomRight,
        ),
        borderRadius: BorderRadius.circular(16),
        border: Border.all(color: color.withValues(alpha: 0.18)),
      ),
      child: Column(
        crossAxisAlignment: CrossAxisAlignment.start,
        children: [
          Row(
            children: [
              Container(
                width: 34,
                height: 34,
                decoration: BoxDecoration(
                  color: color,
                  borderRadius: BorderRadius.circular(10),
                ),
                child: Icon(icon, color: Colors.white, size: 18),
              ),
            ],
          ),
          const SizedBox(height: 12),
          Text(
            value,
            style: Theme.of(context).textTheme.headlineMedium?.copyWith(
              fontWeight: FontWeight.w800,
              color: color,
              fontSize: 26,
            ),
          ),
          const SizedBox(height: 2),
          Text(
            title,
            style: Theme.of(context).textTheme.bodySmall?.copyWith(
              color: Theme.of(context).colorScheme.onSurfaceVariant,
              fontWeight: FontWeight.w600,
            ),
          ),
        ],
      ),
      ),
    );
  }
}

class _QuickAction extends StatelessWidget {
  final IconData icon;
  final String label;
  final Color color;
  final VoidCallback onTap;

  const _QuickAction({
    required this.icon,
    required this.label,
    required this.color,
    required this.onTap,
  });

  @override
  Widget build(BuildContext context) {
    return Material(
      color: color.withValues(alpha: 0.1),
      borderRadius: BorderRadius.circular(16),
      child: InkWell(
        onTap: onTap,
        borderRadius: BorderRadius.circular(16),
        child: Padding(
          padding: const EdgeInsets.all(14),
          child: Row(
            children: [
              Container(
                width: 40,
                height: 40,
                decoration: BoxDecoration(
                  color: color.withValues(alpha: 0.15),
                  borderRadius: BorderRadius.circular(12),
                ),
                child: Icon(icon, color: color, size: 22),
              ),
              const SizedBox(width: 12),
              Expanded(
                child: Text(
                  label,
                  maxLines: 2,
                  overflow: TextOverflow.ellipsis,
                  style: Theme.of(context).textTheme.labelLarge?.copyWith(
                    color: color,
                    fontWeight: FontWeight.w700,
                  ),
                ),
              ),
              Icon(Icons.chevron_right, color: color.withValues(alpha: 0.6)),
            ],
          ),
        ),
      ),
    );
  }
}

/// Preset chips plus a calendar escape hatch, shown above the summary cards.
class _PeriodSelector extends ConsumerWidget {
  final DateRange range;

  const _PeriodSelector({required this.range});

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);
    final selected = ref.watch(dashboardPeriodProvider);
    final sameDay =
        range.from.year == range.to.year &&
        range.from.month == range.to.month &&
        range.from.day == range.to.day;

    return Column(
      crossAxisAlignment: CrossAxisAlignment.start,
      children: [
        SingleChildScrollView(
          scrollDirection: Axis.horizontal,
          child: Row(
            children: [
              _chip(context, ref, DashboardPeriod.today, "Aujourd'hui", selected),
              const SizedBox(width: 8),
              _chip(context, ref, DashboardPeriod.week, '7 jours', selected),
              const SizedBox(width: 8),
              _chip(context, ref, DashboardPeriod.month, 'Ce mois', selected),
              const SizedBox(width: 8),
              ActionChip(
                avatar: const Icon(Icons.date_range, size: 18),
                label: const Text('Période'),
                onPressed: () => _pickRange(context, ref),
                backgroundColor: selected == DashboardPeriod.custom
                    ? theme.colorScheme.primary.withValues(alpha: 0.15)
                    : null,
              ),
            ],
          ),
        ),
        const SizedBox(height: 6),
        Text(
          sameDay
              ? range.from.formatDate()
              : '${range.from.formatDate()} → ${range.to.formatDate()}',
          style: theme.textTheme.bodySmall?.copyWith(
            color: theme.colorScheme.onSurfaceVariant,
          ),
        ),
      ],
    );
  }

  Widget _chip(
    BuildContext context,
    WidgetRef ref,
    DashboardPeriod period,
    String label,
    DashboardPeriod selected,
  ) {
    return ChoiceChip(
      label: Text(label),
      selected: selected == period,
      onSelected: (_) =>
          ref.read(dashboardPeriodProvider.notifier).state = period,
    );
  }

  Future<void> _pickRange(BuildContext context, WidgetRef ref) async {
    final now = DateTime.now();
    final picked = await showDateRangePicker(
      context: context,
      firstDate: DateTime(now.year - 5),
      lastDate: DateTime(now.year + 1, 12, 31),
      initialDateRange: DateTimeRange(start: range.from, end: range.to),
    );
    if (picked == null) return;

    final end = picked.end;
    ref.read(dashboardCustomRangeProvider.notifier).state = (
      from: DateTime(picked.start.year, picked.start.month, picked.start.day),
      to: DateTime(end.year, end.month, end.day, 23, 59, 59, 999),
    );
    ref.read(dashboardPeriodProvider.notifier).state = DashboardPeriod.custom;
  }
}

enum _BreakdownKind { clients, cases }

/// Drill-down opened by tapping a summary card; always scoped to the same
/// window the card counted.
class _BreakdownSheet extends ConsumerWidget {
  final DateRange range;
  final String title;
  final Color color;
  final _BreakdownKind kind;
  final VisaStatus? status;

  const _BreakdownSheet({
    required this.range,
    required this.title,
    required this.color,
    required this.kind,
    this.status,
  });

  @override
  Widget build(BuildContext context, WidgetRef ref) {
    final theme = Theme.of(context);

    return DraggableScrollableSheet(
      initialChildSize: 0.7,
      minChildSize: 0.4,
      maxChildSize: 0.95,
      expand: false,
      builder: (context, scrollController) => Container(
        decoration: BoxDecoration(
          color: theme.scaffoldBackgroundColor,
          borderRadius: const BorderRadius.vertical(top: Radius.circular(20)),
        ),
        child: Column(
          children: [
            const SizedBox(height: 10),
            Container(
              width: 40,
              height: 4,
              decoration: BoxDecoration(
                color: theme.colorScheme.onSurfaceVariant.withValues(alpha: 0.3),
                borderRadius: BorderRadius.circular(2),
              ),
            ),
            Padding(
              padding: const EdgeInsets.fromLTRB(16, 14, 16, 6),
              child: Row(
                children: [
                  Container(
                    width: 10,
                    height: 10,
                    decoration: BoxDecoration(
                      color: color,
                      shape: BoxShape.circle,
                    ),
                  ),
                  const SizedBox(width: 8),
                  Expanded(
                    child: Text(
                      title,
                      style: theme.textTheme.titleMedium?.copyWith(
                        fontWeight: FontWeight.bold,
                      ),
                    ),
                  ),
                  Text(
                    '${range.from.formatDate()} → ${range.to.formatDate()}',
                    style: theme.textTheme.bodySmall?.copyWith(
                      color: theme.colorScheme.onSurfaceVariant,
                    ),
                  ),
                ],
              ),
            ),
            const Divider(height: 1),
            Expanded(
              child: kind == _BreakdownKind.clients
                  ? _clientsList(context, ref, scrollController)
                  : _casesList(context, ref, scrollController),
            ),
          ],
        ),
      ),
    );
  }

  Widget _clientsList(
    BuildContext context,
    WidgetRef ref,
    ScrollController controller,
  ) {
    final async = ref.watch(clientsInRangeProvider(range));
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppErrorWidget(message: e.toString()),
      data: (clients) {
        if (clients.isEmpty) return _empty(context);
        return ListView.builder(
          controller: controller,
          padding: const EdgeInsets.all(12),
          itemCount: clients.length,
          itemBuilder: (_, i) {
            final c = clients[i];
            return AppCard(
              margin: const EdgeInsets.only(bottom: 8),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/clients/${c.id}');
              },
              child: ListTile(
                leading: AvatarWidget(
                  initials: c.fullName.isNotEmpty ? c.fullName[0] : '?',
                  size: 40,
                ),
                title: Text(c.fullName),
                subtitle: Text(c.phoneNumber),
                trailing: const Icon(Icons.chevron_right),
              ),
            );
          },
        );
      },
    );
  }

  Widget _casesList(
    BuildContext context,
    WidgetRef ref,
    ScrollController controller,
  ) {
    final filters = <String, dynamic>{
      ...rangeParams(range),
      'limit': 100,
      if (status != null) 'status': status!.toJson(),
    };
    final async = ref.watch(visaCasesProvider(filters));
    return async.when(
      loading: () => const Center(child: CircularProgressIndicator()),
      error: (e, _) => AppErrorWidget(message: e.toString()),
      data: (cases) {
        if (cases.isEmpty) return _empty(context);
        return ListView.builder(
          controller: controller,
          padding: const EdgeInsets.all(12),
          itemCount: cases.length,
          itemBuilder: (_, i) {
            final vc = cases[i];
            return AppCard(
              margin: const EdgeInsets.only(bottom: 8),
              onTap: () {
                Navigator.of(context).pop();
                context.push('/visa-cases/${vc.id}');
              },
              child: ListTile(
                title: Text(
                  vc.caseNumber,
                  style: const TextStyle(fontWeight: FontWeight.w600),
                ),
                subtitle: Text(
                  '${vc.visaCountry} - ${vc.visaType}',
                ),
                trailing: Text(
                  vc.currentStatus.displayName,
                  style: TextStyle(
                    color: vc.currentStatus.color,
                    fontSize: 11,
                    fontWeight: FontWeight.w600,
                  ),
                ),
              ),
            );
          },
        );
      },
    );
  }

  Widget _empty(BuildContext context) => EmptyState(
    icon: Icons.inbox_outlined,
    title: 'Aucun résultat pour cette période',
  );
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
