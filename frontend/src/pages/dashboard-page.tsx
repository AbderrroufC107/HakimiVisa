import { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router';
import { clientsService, appointmentsService, visaCasesService } from '@/services';
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
  Users, FileText, Clock, CheckCircle2, XCircle,
  CalendarCheck, Calendar, AlertTriangle,
} from 'lucide-react';
import { VISA_STATUS_COLORS, type VisaStatus, type VisaCase } from '@/types';
import { format, addDays } from 'date-fns';
import { fr, enUS } from 'date-fns/locale';
import { useTranslation } from 'react-i18next';

const STATUS_PIE_COLORS: Record<string, string> = {
  EN_ATTENTE: '#EAB308',
  EN_TRAITEMENT: '#3B82F6',
  RDV_OK: '#A855F7',
  VISA_OK: '#22C55E',
  VISA_REFUSEE: '#EF4444',
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
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? fr : enUS;

  const { data: statsData, isLoading: statsLoading } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => clientsService.getDashboardStats(),
    refetchInterval: 30_000,
  });

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

  const { data: recentApproved } = useQuery({
    queryKey: ['dashboard', 'recent-approved'],
    queryFn: () => visaCasesService.findAll({ status: 'VISA_OK' as VisaStatus, limit: 5 }),
  });

  const { data: recentRefused } = useQuery({
    queryKey: ['dashboard', 'recent-refused'],
    queryFn: () => visaCasesService.findAll({ status: 'VISA_REFUSEE' as VisaStatus, limit: 5 }),
  });

  const approvedCases: VisaCase[] = recentApproved?.data ?? [];
  const refusedCases: VisaCase[] = recentRefused?.data ?? [];
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
    { title: t('dashboard:totalClients'), value: stats?.totalClients ?? 0, icon: Users, href: ROUTES.CLIENTS, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: t('dashboard:totalCases'), value: stats?.totalCases ?? 0, icon: FileText, href: ROUTES.VISA_CASES, color: 'text-indigo-600', bg: 'bg-indigo-100' },
    { title: t('dashboard:enAttente'), value: stats?.enAttente ?? 0, icon: Clock, href: ROUTES.KANBAN, color: 'text-yellow-600', bg: 'bg-yellow-100' },
    { title: t('dashboard:enTraitement'), value: stats?.enTraitement ?? 0, icon: FileText, href: ROUTES.KANBAN, color: 'text-blue-600', bg: 'bg-blue-100' },
    { title: t('dashboard:rdvOk'), value: stats?.rdvOk ?? 0, icon: CalendarCheck, href: ROUTES.KANBAN, color: 'text-orange-600', bg: 'bg-orange-100' },
    { title: t('dashboard:visaOk'), value: stats?.visaOk ?? 0, icon: CheckCircle2, href: ROUTES.VISA_CASES, color: 'text-green-600', bg: 'bg-green-100' },
    { title: t('dashboard:visaRefused'), value: stats?.refuse ?? 0, icon: XCircle, href: ROUTES.VISA_CASES, color: 'text-red-600', bg: 'bg-red-100' },
  ], [t, stats?.totalClients, stats?.totalCases, stats?.enAttente, stats?.enTraitement, stats?.rdvOk, stats?.visaOk, stats?.refuse]);

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
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 7 }).map((_, i) => (
            <Card key={i}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <div className="skeleton-shimmer h-4 w-24 rounded" />
                <div className="skeleton-shimmer h-8 w-8 rounded-lg" />
              </CardHeader>
              <CardContent>
                <div className="skeleton-shimmer h-8 w-16 rounded" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {statCards.map((card) => {
            const Icon = card.icon;
            return (
              <Card key={card.title} className="group cursor-pointer transition-all hover:shadow-md hover:border-primary/20" onClick={() => navigate(card.href)}>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">{card.title}</CardTitle>
                  <div className={`rounded-lg p-2 transition-transform group-hover:scale-110 ${card.bg}`}>
                    <Icon className={`h-4 w-4 ${card.color}`} />
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{card.value}</div>
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
                    <Bar dataKey="approved" name={t('dashboard:chartApproved')} fill="#22C55E" radius={[4, 4, 0, 0]} isAnimationActive={false} />
                    <Bar dataKey="refused" name={t('dashboard:chartRefused')} fill="#EF4444" radius={[4, 4, 0, 0]} isAnimationActive={false} />
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
              <div className="h-64 md:h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={statusDistribution}
                      dataKey="count"
                      nameKey="status"
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={Math.min(120, totalCount > 0 ? 120 : 80)}
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
                      wrapperStyle={{ fontSize: 12, paddingTop: 8 }}
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
                <CardTitle className="text-sm">{t('dashboard:approvalRate')}</CardTitle>
              </CardHeader>
              <CardContent>
                {analyticsLoading ? (
                  <div className="flex flex-col items-center justify-center py-4 gap-3">
                    <div className="skeleton-shimmer h-12 w-20 rounded" />
                    <div className="skeleton-shimmer h-4 w-36 rounded" />
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-4">
                    <div className="text-5xl font-bold text-green-600">
                      {analytics?.approvalRate ?? 0}%
                    </div>
                    <p className="mt-2 text-sm text-muted-foreground">
                      {t('dashboard:approvedCases')}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>

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

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-green-600" />
                  <CardTitle className="text-sm">{t('dashboard:recentApproved')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {approvedCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('dashboard:noApproved')}</p>
                ) : (
                  <div className="space-y-2">
                    {approvedCases.map((vc) => (
                      <div key={vc.id} className="flex cursor-pointer items-center justify-between rounded-lg border p-2 text-sm hover:bg-muted/50" onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs font-medium">{vc.caseNumber}</p>
                          <p className="truncate text-xs text-muted-foreground">{vc.client?.fullName} - {vc.visaCountry}</p>
                        </div>
                        <Badge className={VISA_STATUS_COLORS[vc.currentStatus]}>{t('status:' + vc.currentStatus)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-4 w-4 text-red-600" />
                  <CardTitle className="text-sm">{t('dashboard:recentRefused')}</CardTitle>
                </div>
              </CardHeader>
              <CardContent>
                {refusedCases.length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('dashboard:noRefused')}</p>
                ) : (
                  <div className="space-y-2">
                    {refusedCases.map((vc) => (
                      <div key={vc.id} className="flex cursor-pointer items-center justify-between rounded-lg border p-2 text-sm hover:bg-muted/50" onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))}>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-mono text-xs font-medium">{vc.caseNumber}</p>
                          <p className="truncate text-xs text-muted-foreground">{vc.client?.fullName} - {vc.visaCountry}</p>
                        </div>
                        <Badge className={VISA_STATUS_COLORS[vc.currentStatus]}>{t('status:' + vc.currentStatus)}</Badge>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
    </div>
  );
}
