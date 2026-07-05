import { useState, useMemo, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { appointmentsService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks';
import type { AppointmentType, CreateAppointmentRequest } from '@/types';
import { APPOINTMENT_TYPE_COLORS } from '@/types';

type ViewMode = 'month' | 'week' | 'day';

function AppointmentForm({ onSubmit, initial }: { onSubmit: (data: CreateAppointmentRequest) => void; initial?: Partial<CreateAppointmentRequest> }) {
  const { t } = useTranslation();
  const [form, setForm] = useState<CreateAppointmentRequest>({
    visaCaseId: initial?.visaCaseId ?? '',
    appointmentDate: initial?.appointmentDate ?? '',
    appointmentTime: initial?.appointmentTime ?? '',
    appointmentCenter: initial?.appointmentCenter ?? '',
    appointmentType: initial?.appointmentType ?? 'TLS',
    notes: initial?.notes ?? '',
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.visaCaseId || !form.appointmentDate || !form.appointmentTime || !form.appointmentCenter) {
      toast.error(t('common:fillRequiredFields'));
      return;
    }
    onSubmit(form);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div className="space-y-1">
        <Label>{t('appointments:visaCaseId')}</Label>
        <Input data-testid="appointment-visa-case-id" required value={form.visaCaseId} onChange={(e) => setForm({ ...form, visaCaseId: e.target.value })} placeholder={t('appointments:enterVisaCaseId')} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <div className="space-y-1">
          <Label>{t('appointments:date')}</Label>
          <Input data-testid="appointment-date" required type="date" value={form.appointmentDate} onChange={(e) => setForm({ ...form, appointmentDate: e.target.value })} />
        </div>
        <div className="space-y-1">
          <Label>{t('appointments:time')}</Label>
          <Input data-testid="appointment-time" required type="time" value={form.appointmentTime} onChange={(e) => setForm({ ...form, appointmentTime: e.target.value })} />
        </div>
      </div>
      <div className="space-y-1">
        <Label>{t('appointments:center')}</Label>
        <Input data-testid="appointment-center" required value={form.appointmentCenter} onChange={(e) => setForm({ ...form, appointmentCenter: e.target.value })} placeholder={t('appointments:centerPlaceholder')} />
      </div>
      <div className="space-y-1">
        <Label>{t('appointments:type')}</Label>
        <Select value={form.appointmentType} onValueChange={(v: AppointmentType) => setForm({ ...form, appointmentType: v })}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            {(['TLS', 'VFS', 'EMBASSY', 'BIOMETRICS', 'INTERVIEW', 'OTHER'] as const).map((k) => (
              <SelectItem key={k} value={k}>{t(`appointmentType:${k}`)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      <div className="space-y-1">
        <Label>{t('common:notes')}</Label>
        <Input data-testid="appointment-notes" value={form.notes ?? ''} onChange={(e) => setForm({ ...form, notes: e.target.value })} placeholder={t('appointments:notesPlaceholder')} />
      </div>
      <Button type="submit" className="w-full" data-testid="appointment-submit">{t('common:save')}</Button>
    </form>
  );
}

export function AppointmentsPage() {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const isMobile = useMediaQuery('(max-width: 768px)');
  const [viewMode, setViewMode] = useState<ViewMode>(isMobile ? 'day' : 'month');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>('all');

  const locale = i18n.language?.startsWith('fr') ? fr : enUS;

  const dateFrom = useMemo(() => {
    if (viewMode === 'month') return startOfWeek(startOfMonth(currentDate));
    if (viewMode === 'week') return startOfWeek(currentDate);
    return startOfWeek(currentDate);
  }, [viewMode, currentDate]);

  const dateTo = useMemo(() => {
    if (viewMode === 'month') return endOfWeek(endOfMonth(currentDate));
    if (viewMode === 'week') return endOfWeek(currentDate);
    return endOfWeek(currentDate);
  }, [viewMode, currentDate]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateFrom.toISOString(), dateTo.toISOString()],
    queryFn: () => appointmentsService.findAll({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      ...(filterType !== 'all' ? { appointmentType: filterType as AppointmentType } : {}),
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowCreateDialog(false);
      toast.success(t('appointments:appointmentCreated'));
    },
    onError: () => toast.error(t('appointments:createError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('appointments:appointmentDeleted'));
    },
    onError: () => toast.error(t('appointments:deleteError')),
  });

  const navigate = useCallback((dir: 'prev' | 'next') => {
    const delta = dir === 'next' ? 1 : -1;
    if (viewMode === 'month') setCurrentDate(d => delta > 0 ? addMonths(d, 1) : subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => delta > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => delta > 0 ? addDays(d, 1) : subDays(d, 1));
  }, [viewMode]);

  const days = useMemo(() => {
    if (viewMode === 'month') {
      return eachDayOfInterval({ start: dateFrom, end: dateTo });
    }
    if (viewMode === 'week') {
      return eachDayOfInterval({ start: dateFrom, end: dateTo });
    }
    return [currentDate];
  }, [viewMode, dateFrom, dateTo, currentDate]);

  const getAppointmentsForDay = useCallback((day: Date) => {
    return appointments.filter((a) => isSameDay(new Date(a.appointmentDate), day));
  }, [appointments]);

  const title = useMemo(() => {
    if (viewMode === 'month') return format(currentDate, 'MMMM yyyy', { locale });
    if (viewMode === 'week') {
      const start = startOfWeek(currentDate);
      const end = endOfWeek(currentDate);
      return `${format(start, 'd MMM', { locale })} - ${format(end, 'd MMM yyyy', { locale })}`;
    }
    return format(currentDate, 'EEEE d MMMM yyyy', { locale });
  }, [viewMode, currentDate, locale]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('nav:appointments')}</h1>
          <p className="text-sm text-muted-foreground">{t('appointments:found', { count: appointments.length })}</p>
        </div>
        <div className="flex items-center gap-2">
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="w-36 h-9 text-sm"><SelectValue /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">{t('common:all')}</SelectItem>
              {(['TLS', 'VFS', 'EMBASSY', 'BIOMETRICS', 'INTERVIEW', 'OTHER'] as const).map((k) => (
                <SelectItem key={k} value={k}>{t(`appointmentType:${k}`)}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
            <DialogTrigger asChild>
              <Button size="sm" data-testid="new-appointment-button"><Plus className="h-4 w-4 mr-1" />{t('appointments:newAppointment')}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>{t('appointments:schedule')}</DialogTitle></DialogHeader>
              <AppointmentForm onSubmit={(data) => createMutation.mutate(data)} />
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1">
              <Button variant="ghost" size="icon" onClick={() => navigate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base capitalize" data-testid="calendar-title">{title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigate('next')}><ChevronRight className="h-4 w-4" /></Button>
            </div>
            <div className="flex items-center gap-1 rounded-lg border p-0.5">
              {(['month', 'week', 'day'] as ViewMode[]).map((mode) => (
                <Button key={mode} variant={viewMode === mode ? 'secondary' : 'ghost'} size="sm" className="h-7 text-xs" onClick={() => setViewMode(mode)}>
                  {mode === 'month' ? t('appointments:month') : mode === 'week' ? t('appointments:week') : t('appointments:day')}
                </Button>
              ))}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
              {[t('appointments:monday'), t('appointments:tuesday'), t('appointments:wednesday'), t('appointments:thursday'), t('appointments:friday'), t('appointments:saturday'), t('appointments:sunday')].map((d) => (
                <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
              ))}
              {Array.from({ length: 35 }).map((_, i) => (
                <div key={i} className="bg-card p-2 min-h-20">
                  <div className="skeleton-shimmer h-4 w-6 rounded mb-1" />
                  <div className="skeleton-shimmer h-3 w-full rounded" />
                </div>
              ))}
            </div>
          ) : (
            <>
              <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
                {[t('appointments:monday'), t('appointments:tuesday'), t('appointments:wednesday'), t('appointments:thursday'), t('appointments:friday'), t('appointments:saturday'), t('appointments:sunday')].map((d) => (
                  <div key={d} className="bg-muted/50 px-2 py-1.5 text-center text-xs font-medium text-muted-foreground">{d}</div>
                ))}
                {days.map((day) => {
                  const dayApps = getAppointmentsForDay(day);
                  const isToday = isSameDay(day, new Date());
                  const isCurrentMonth = isSameMonth(day, currentDate);

                  return (
                    <div
                      key={day.toISOString()}
                      className={cn(
                        'min-h-24 bg-card p-1 transition-colors',
                        !isCurrentMonth && 'opacity-40',
                        isToday && 'bg-accent/30',
                      )}
                    >
                      <span className={cn(
                        'inline-flex h-6 w-6 items-center justify-center rounded-full text-xs',
                        isToday && 'bg-primary text-primary-foreground font-bold',
                      )}>
                        {format(day, 'd')}
                      </span>
                      <div className="mt-0.5 space-y-0.5">
                        {dayApps.slice(0, 3).map((app) => (
                          <div
                            key={app.id}
                            className="group relative cursor-pointer rounded px-1 py-0.5 text-[10px] leading-tight truncate"
                            style={{ backgroundColor: app.appointmentType === 'TLS' ? '#dbeafe' : app.appointmentType === 'VFS' ? '#f3e8ff' : app.appointmentType === 'EMBASSY' ? '#dcfce7' : app.appointmentType === 'BIOMETRICS' ? '#ffedd5' : app.appointmentType === 'INTERVIEW' ? '#fef9c3' : '#f3f4f6' }}
                            title={`${app.appointmentTime} - ${app.visaCase?.client?.fullName ?? app.visaCaseId} @ ${app.appointmentCenter}`}
                          >
                            {app.appointmentTime} {app.visaCase?.client?.fullName ?? ''}
                          </div>
                        ))}
                        {dayApps.length > 3 && (
                          <p className="px-1 text-[10px] text-muted-foreground">{t('appointments:more', { count: dayApps.length - 3 })}</p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div className="mt-4 space-y-2">
                <h3 className="text-sm font-medium">{t('appointments:todayAppointments')}</h3>
                {appointments.filter((a) => isSameDay(new Date(a.appointmentDate), currentDate)).length === 0 ? (
                  <p className="text-sm text-muted-foreground">{t('appointments:noAppointmentsForPeriod')}</p>
                ) : (
                  appointments.filter((a) => isSameDay(new Date(a.appointmentDate), currentDate)).map((app) => (
                    <div key={app.id} className="flex items-center justify-between rounded-lg border p-3" data-testid="appointment-list-item" data-appointment-id={app.id}>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-sm font-medium">{app.appointmentTime}</span>
                          <Badge className={APPOINTMENT_TYPE_COLORS[app.appointmentType]}>{t(`appointmentType:${app.appointmentType}`)}</Badge>
                        </div>
                        <p className="text-sm truncate">{app.visaCase?.client?.fullName ?? t('common:na')} - {app.appointmentCenter}</p>
                        <p className="text-xs text-muted-foreground">{app.visaCase?.caseNumber ?? app.visaCaseId}</p>
                      </div>
                      <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" aria-label={t('appointments:deleteAppointmentLabel')} onClick={() => { if (confirm(t('appointments:confirmDelete'))) deleteMutation.mutate(app.id); }}>
                        <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                      </Button>
                    </div>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
