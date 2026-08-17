import { useEffect, useMemo } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { clientsService, appointmentsService } from '@/services';
import { ROUTES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from 'recharts';
import type { PieLabelRenderProps } from 'recharts';
import {
  FileText, Clock, CalendarCheck, Calendar, FilePlus2, FileWarning, PackageCheck, Loader2,
} from 'lucide-react';
import { format, addDays } from 'date-fns';
import { fr, enUS, ar } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';
import { useSocket } from '@/providers/websocket-provider';

const STATUS_PIE_COLORS: Record<string, string> = {
  EN_ATTENTE: '#EAB308',
  EN_TRAITEMENT: '#3B82F6',
  RDV_OK: '#A855F7',
  LIVREE: '#14B8A6',
};

function ChartSkeleton() {
  return (
    <div className="h-64 md:h-72 flex items-center justify-center">
      <div className="w-full h-full space-y-4 p-4">
        <div className="flex justify-center gap-8">
          <div className="skeleton-shimmer h-24 w-24 rounded-full" />
          <div className="space-y-2">
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className="skeleton-shimmer h-3 w-28 rounded" />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BarChartSkeleton() {
  return (
    <div className="h-64 md:h-72 flex items-end justify-center gap-3 p-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <div
          key={i}
          className="skeleton-shimmer w-8 rounded"
          style={{ height: `${40 + Math.random() * 60}%` }}
        />
      ))}
    </div>
  );
}

export function DashboardPage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('ar') ? ar : i18n.language?.startsWith('fr') ? fr : enUS;
  const { socket } = useSocket();

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => clientsService.getDashboardStats(),
    refetchInterval: 30_000,
  });

  // Live updates: refresh stats instantly on websocket events
  useEffect(() => {
    if (!socket) return;
    const refresh = () => {
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
    };
    socket.on('visaCase:statusChange', refresh);
    socket.on('appointment:created', refresh);
    socket.on('appointment:updated', refresh);
    socket.on('appointment:deleted', refresh);
    return () => {
      socket.off('visaCase:statusChange', refresh);
      socket.off('appointment:created', refresh);
      socket.off('appointment:updated', refresh);
      socket.off('appointment:deleted', refresh);
    };
  }, [socket, queryClient]);

  const { data: analyticsData, isLoading: analyticsLoading } = useQuery({
    queryKey: ['dashboard', 'analytics'],
    queryFn: () => clientsService.getAnalytics(),
    refetchInterval: 60_000,
  });

  const today = useMemo(() => new Date(), []);
  const weekEnd = useMemo(() => addDays(today, 7), [today]);

  const { data: upcomingAppointments = [] } = useQuery({
    queryKey: ['dashboard', 'appointments', today.toISOString(), weekEnd.toISOString()],
    queryFn: () => appointmentsService.findAll({
      dateFrom: today.toISOString(),
      dateTo: weekEnd.toISOString(),
    }),
  });

  const stats = statsData;
  const analytics = analyticsData;

  const statusDistribution = useMemo(() => {
    if (!analytics?.statusDistribution) return [];
    return analytics.statusDistribution;
  }, [analytics?.statusDistribution]);

  const applicationsPerMonth = useMemo(() => {
    if (!analytics?.applicationsPerMonth) return [];
    return analytics.applicationsPerMonth;
  }, [analytics?.applicationsPerMonth]);

  const topCountries = useMemo(() => {
    if (!analytics?.topCountries) return [];
    return analytics.topCountries;
  }, [analytics?.topCountries]);

  const statCards = useMemo(() => [
    { title: t('dashboard:totalCases'), value: stats?.totalCases ?? 0, icon: FileText, href: ROUTES.VISA_CASES, color: 'text-indigo-600 dark:text-indigo-400', bg: 'bg-indigo-100 dark:bg-indigo-500/15' },
    { title: t('dashboard:newCases'), value: stats?.newCases ?? 0, icon: FilePlus2, href: ROUTES.VISA_CASES, color: 'text-cyan-600 dark:text-cyan-400', bg: 'bg-cyan-100 dark:bg-cyan-500/15' },
    { title: t('dashboard:enAttente'), value: stats?.enAttente ?? 0, icon: Clock, href: ROUTES.KANBAN, color: 'text-yellow-600 dark:text-yellow-400', bg: 'bg-yellow-100 dark:bg-yellow-500/15' },
    { title: t('dashboard:enTraitement'), value: stats?.enTraitement ?? 0, icon: Loader2, href: ROUTES.KANBAN, color: 'text-blue-600 dark:text-blue-400', bg: 'bg-blue-100 dark:bg-blue-500/15' },
    { title: t('dashboard:rdvOk'), value: stats?.rdvOk ?? 0, icon: CalendarCheck, href: ROUTES.KANBAN, color: 'text-purple-600 dark:text-purple-400', bg: 'bg-purple-100 dark:bg-purple-500/15' },
    { title: t('dashboard:incomplete'), value: stats?.incomplete ?? 0, icon: FileWarning, href: ROUTES.KANBAN, color: 'text-amber-600 dark:text-amber-400', bg: 'bg-amber-100 dark:bg-amber-500/15' },
    { title: t('dashboard:livree'), value: stats?.livree ?? 0, icon: PackageCheck, href: ROUTES.VISA_CASES, color: 'text-teal-600 dark:text-teal-400', bg: 'bg-teal-100 dark:bg-teal-500/15' },
  ], [t, stats?.totalCases, stats?.newCases, stats?.enAttente, stats?.enTraitement, stats?.rdvOk, stats?.incomplete, stats?.livree]);

  const totalCount = useMemo(
    () => statusDistribution.reduce((sum, d) => sum + d.count, 0),
    [statusDistribution],
  );

  const renderPieLabel = ({ cx, cy, midAngle, outerRadius, percent }: PieLabelRenderProps) => {
    if (!percent || midAngle == null) return null;
    const angle = -midAngle * (Math.PI / 180);
    const radius = (outerRadius as number) + 24;
    const x = (cx as number) + radius * Math.cos(angle);
    const y = (cy as number) + radius * Math.sin(angle);
    const text = `${(percent * 100).toFixed(0)}%`;
    return (
      <text x={x} y={y} fill="hsl(var(--foreground))" textAnchor={x > (cx as number) ? 'start' : 'end'} dominantBaseline="central" fontSize={12} fontWeight={500}>
        {text}
      </text>
    );
  };

  const renderLegend = (value: string) => {
    return t('status:' + value);
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('dashboard:title')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard:subtitle')}</p>
      </div>

      {statsLoading ? (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {Array.from({ length: 9 }).map((_, i) => (
            <Card key={i}>
              <CardContent className="p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="skeleton-shimmer h-3 w-24 rounded" />
                  <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
                </div>
                <div className="skeleton-shimmer mt-2 h-8 w-16 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-5">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card
                key={card.title}
                className="group cursor-pointer transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md"
                onClick={() => navigate(card.href)}
              >
                <CardContent className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <CardTitle className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground">
                      {card.title}
                    </CardTitle>
                    <div className={`shrink-0 rounded-lg p-2 transition-transform duration-200 group-hover:scale-105 ${card.bg}`}>
                      <Icon className={`h-4 w-4 ${card.color}`} />
                    </div>
                  </div>
                  <div className="mt-2 text-3xl font-bold leading-none tracking-tight tabular-nums">
                    {card.value}
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      {/* Charts Row */}
      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard:applicationsPerMonth')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading ? (
              <BarChartSkeleton />
            ) : (
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={applicationsPerMonth}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip />
                    <Bar dataKey="applications" name={t('dashboard:chartTotal')} fill="#3B82F6" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-sm">{t('dashboard:statusDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {analyticsLoading || statusDistribution.length === 0 ? (
              <ChartSkeleton />
            ) : (
              <div className="h-72 md:h-80">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="44%"
                      innerRadius={44}
                      outerRadius={Math.min(92, totalCount > 0 ? 92 : 70)}
                      paddingAngle={2}
                      label={renderPieLabel}
                      labelLine
                      isAnimationActive={false}
                    >
                      {statusDistribution.map((entry) => (
                        <Cell key={entry.status} fill={STATUS_PIE_COLORS[entry.status] ?? '#999'} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value, name) => [value, t('status:' + name)]}
                    />
                    <Legend
                      formatter={renderLegend}
                      verticalAlign="bottom"
                      height={48}
                      iconType="circle"
                      iconSize={8}
                      wrapperStyle={{ fontSize: 12, paddingTop: 12, lineHeight: '20px' }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

          {/* Approval Rate + Top Countries */}
          <div className="grid gap-6 md:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">{t('dashboard:topCountries')}</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="space-y-3 p-2">
                    {Array.from({ length: 5 }).map((_, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <div className="skeleton-shimmer h-4 w-6 rounded" />
                        <div className="flex-1 space-y-1">
                          <div className="skeleton-shimmer h-3 w-full rounded" />
                          <div className="skeleton-shimmer h-1.5 w-full rounded-full" />
                        </div>
                      </div>
                    ))}
                  </div>
                ) : topCountries.length > 0 ? (
                  <div className="space-y-2">
                    {topCountries.map((country, idx) => (
                      <div key={country.country} className="flex items-center gap-2">
                        <span className="w-6 text-right text-sm font-medium text-muted-foreground">
                          {idx + 1}
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center justify-between text-sm">
                            <span>{country.country}</span>
                            <span className="font-medium">{country.count}</span>
                          </div>
                          <div className="mt-1 h-1.5 w-full rounded-full bg-muted">
                            <div
                              className="h-1.5 rounded-full bg-primary"
                              style={{
                                width: `${Math.min(
                                  (country.count /
                                    Math.max(...topCountries.map((c) => c.count))) *
                                    100,
                                  100,
                                )}%`,
                              }}
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">{t('common:noData')}</p>
                )}
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" />
                  <CardTitle className="text-sm">{t('dashboard:upcomingAppointments')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {upcomingAppointments.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('dashboard:noUpcomingAppointments')}</p>
                ) : (
                  <div className="space-y-2">
                    {upcomingAppointments.slice(0, 5).map((app) => (
                      <div key={app.id} className="flex items-center justify-between rounded-lg border p-2 text-sm">
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-medium">{app.visaCase?.client?.fullName ?? t('common:none')}</p>
                          <p className="text-xs text-muted-foreground">
                            {format(new Date(app.appointmentDate), 'dd/MM', { locale })} {app.appointmentTime} - {app.appointmentCenter}
                          </p>
                        </div>
                        <Badge className="text-[10px] ml-2">{t('appointmentType:' + app.appointmentType)}</Badge>
                      </div>
                    ))}
                    {upcomingAppointments.length > 5 && (
                      <p className="text-xs text-muted-foreground text-center">{t('dashboard:moreItems', { count: upcomingAppointments.length - 5 })}</p>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

          </div>
    </div>
  );
}
