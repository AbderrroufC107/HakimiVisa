import { useState, useMemo, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import {
  format, startOfMonth, endOfMonth, startOfWeek, endOfWeek,
  eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths,
  addWeeks, subWeeks, addDays, subDays,
} from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { appointmentsService, templatesService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { ChevronLeft, ChevronRight, Plus, Trash2, Pencil, ExternalLink, MessageCircle, Mail, Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useMediaQuery } from '@/hooks';
import type { Appointment, AppointmentType, CreateAppointmentRequest, ApiError } from '@/types';
import { APPOINTMENT_TYPE_COLORS } from '@/types';

type ViewMode = 'month' | 'week' | 'day';

const DAY_START_HOUR = 8;
const DAY_END_HOUR = 20;
const SLOT_HEIGHT = 30; // px per 30 minutes

const TYPE_HEX: Record<string, string> = {
  TLS: '#3b82f6',
  VFS: '#a855f7',
  EMBASSY: '#22c55e',
  BIOMETRICS: '#f97316',
  INTERVIEW: '#eab308',
  OTHER: '#6b7280',
};

function timeToMinutes(time: string): number {
  const [h, m] = time.split(':').map(Number);
  return (h ?? 0) * 60 + (m ?? 0);
}

function toDateInput(dateStr: string): string {
  const d = new Date(dateStr);
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(d.getUTCDate()).padStart(2, '0')}`;
}

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

interface DetailDialogProps {
  appointment: Appointment | null;
  onClose: () => void;
  onUpdate: (id: string, data: Partial<CreateAppointmentRequest>) => void;
  onDelete: (id: string) => void;
  isUpdating: boolean;
}

function AppointmentDetailDialog({ appointment, onClose, onUpdate, onDelete, isUpdating }: DetailDialogProps) {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const [editing, setEditing] = useState(false);
  const [editDate, setEditDate] = useState('');
  const [editTime, setEditTime] = useState('');
  const [editCenter, setEditCenter] = useState('');
  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null);

  if (!appointment) return null;

  const startEdit = () => {
    setEditDate(toDateInput(appointment.appointmentDate));
    setEditTime(appointment.appointmentTime);
    setEditCenter(appointment.appointmentCenter);
    setEditing(true);
  };

  const saveEdit = () => {
    if (!editDate || !editTime) return;
    onUpdate(appointment.id, {
      appointmentDate: editDate,
      appointmentTime: editTime,
      appointmentCenter: editCenter || undefined,
    });
    setEditing(false);
  };

  const handleWhatsapp = async () => {
    setSending('whatsapp');
    try {
      const result = await templatesService.whatsappLink({
        visaCaseId: appointment.visaCaseId,
        appointmentId: appointment.id,
      });
      window.open(result.url, '_blank');
    } catch (error) {
      toast.error((error as ApiError)?.message || t('templates:noTemplate'));
    } finally {
      setSending(null);
    }
  };

  const handleEmail = async () => {
    setSending('email');
    try {
      await templatesService.sendEmail({
        visaCaseId: appointment.visaCaseId,
        appointmentId: appointment.id,
      });
      toast.success(t('templates:emailSent'));
    } catch (error) {
      toast.error((error as ApiError)?.message || t('templates:emailError'));
    } finally {
      setSending(null);
    }
  };

  return (
    <Dialog open={!!appointment} onOpenChange={(open) => { if (!open) { setEditing(false); onClose(); } }}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{t('appointments:details')}</DialogTitle>
        </DialogHeader>

        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-semibold">{appointment.visaCase?.client?.fullName ?? t('common:na')}</p>
              <p className="text-xs text-muted-foreground font-mono">{appointment.visaCase?.caseNumber}</p>
            </div>
            <Badge className={APPOINTMENT_TYPE_COLORS[appointment.appointmentType]}>
              {t(`appointmentType:${appointment.appointmentType}`)}
            </Badge>
          </div>

          {editing ? (
            <div className="space-y-3 rounded-lg border p-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1">
                  <Label>{t('appointments:date')}</Label>
                  <Input type="date" value={editDate} onChange={(e) => setEditDate(e.target.value)} />
                </div>
                <div className="space-y-1">
                  <Label>{t('appointments:time')}</Label>
                  <Input type="time" value={editTime} onChange={(e) => setEditTime(e.target.value)} />
                </div>
              </div>
              <div className="space-y-1">
                <Label>{t('appointments:center')}</Label>
                <Input value={editCenter} onChange={(e) => setEditCenter(e.target.value)} />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" size="sm" onClick={() => setEditing(false)}>{t('common:cancel')}</Button>
                <Button size="sm" onClick={saveEdit} disabled={isUpdating}>{t('common:save')}</Button>
              </div>
            </div>
          ) : (
            <div className="rounded-lg border p-3 text-sm space-y-1">
              <p>
                📅 {new Date(appointment.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
                {' '}· 🕐 {appointment.appointmentTime}
              </p>
              <p>📍 {appointment.appointmentCenter}</p>
              {appointment.notes && <p className="text-muted-foreground">📝 {appointment.notes}</p>}
            </div>
          )}

          <div className="grid grid-cols-2 gap-2">
            <Button variant="outline" size="sm" onClick={handleWhatsapp} disabled={sending !== null}>
              {sending === 'whatsapp' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1 text-green-600" />}
              WhatsApp
            </Button>
            <Button variant="outline" size="sm" onClick={handleEmail} disabled={sending !== null}>
              {sending === 'email' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1 text-blue-600" />}
              Email
            </Button>
          </div>
        </div>

        <DialogFooter className="flex-row justify-between sm:justify-between">
          <div className="flex gap-1">
            <Button variant="ghost" size="icon" aria-label={t('common:edit')} onClick={startEdit}>
              <Pencil className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              aria-label={t('common:delete')}
              className="text-destructive"
              onClick={() => { if (confirm(t('appointments:confirmDelete'))) onDelete(appointment.id); }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
          </div>
          {appointment.visaCase?.id && (
            <Button variant="outline" size="sm" onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(appointment.visaCase!.id))}>
              <ExternalLink className="h-4 w-4 mr-1" />
              {t('appointments:openFile')}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
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
  const [selectedAppointment, setSelectedAppointment] = useState<Appointment | null>(null);
  const [whatsappPrompt, setWhatsappPrompt] = useState<{ url: string; body: string } | null>(null);

  const locale = i18n.language?.startsWith('fr') ? fr : enUS;

  const dateFrom = useMemo(() => {
    if (viewMode === 'month') return startOfWeek(startOfMonth(currentDate));
    return startOfWeek(currentDate);
  }, [viewMode, currentDate]);

  const dateTo = useMemo(() => {
    if (viewMode === 'month') return endOfWeek(endOfMonth(currentDate));
    return endOfWeek(currentDate);
  }, [viewMode, currentDate]);

  const { data: appointments = [], isLoading } = useQuery({
    queryKey: ['appointments', dateFrom.toISOString(), dateTo.toISOString(), filterType],
    queryFn: () => appointmentsService.findAll({
      dateFrom: dateFrom.toISOString(),
      dateTo: dateTo.toISOString(),
      ...(filterType !== 'all' ? { appointmentType: filterType as AppointmentType } : {}),
    }),
  });

  const createMutation = useMutation({
    mutationFn: (data: CreateAppointmentRequest) => appointmentsService.create(data),
    onSuccess: async (created) => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      setShowCreateDialog(false);
      toast.success(t('appointments:appointmentCreated'));

      // Auto-prepare WhatsApp confirmation message
      try {
        const result = await templatesService.whatsappLink({
          visaCaseId: created.visaCaseId,
          appointmentId: created.id,
        });
        setWhatsappPrompt({ url: result.url, body: result.body });
      } catch {
        // No template configured — skip silently
      }
    },
    onError: () => toast.error(t('appointments:createError')),
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<CreateAppointmentRequest> }) =>
      appointmentsService.update(id, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      toast.success(t('appointments:appointmentUpdated'));
      setSelectedAppointment(null);
    },
    onError: () => toast.error(t('appointments:updateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => appointmentsService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      toast.success(t('appointments:appointmentDeleted'));
      setSelectedAppointment(null);
    },
    onError: () => toast.error(t('appointments:deleteError')),
  });

  const navigateDate = useCallback((dir: 'prev' | 'next') => {
    const delta = dir === 'next' ? 1 : -1;
    if (viewMode === 'month') setCurrentDate(d => delta > 0 ? addMonths(d, 1) : subMonths(d, 1));
    else if (viewMode === 'week') setCurrentDate(d => delta > 0 ? addWeeks(d, 1) : subWeeks(d, 1));
    else setCurrentDate(d => delta > 0 ? addDays(d, 1) : subDays(d, 1));
  }, [viewMode]);

  const days = useMemo(() => {
    if (viewMode === 'day') return [currentDate];
    return eachDayOfInterval({ start: dateFrom, end: dateTo });
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

  // Drag & drop handlers (time grid)
  const handleDrop = useCallback((e: React.DragEvent, day: Date, minutes: number) => {
    e.preventDefault();
    const id = e.dataTransfer.getData('text/appointment-id');
    if (!id) return;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    const newTime = `${String(hours).padStart(2, '0')}:${String(mins).padStart(2, '0')}`;
    const newDate = `${day.getFullYear()}-${String(day.getMonth() + 1).padStart(2, '0')}-${String(day.getDate()).padStart(2, '0')}`;
    updateMutation.mutate({ id, data: { appointmentDate: newDate, appointmentTime: newTime } });
  }, [updateMutation]);

  const hours = useMemo(() => {
    const list: number[] = [];
    for (let h = DAY_START_HOUR; h < DAY_END_HOUR; h++) list.push(h);
    return list;
  }, []);

  const renderTimeGrid = () => {
    const gridDays = viewMode === 'day' ? [currentDate] : days.slice(0, 7);
    const totalSlots = (DAY_END_HOUR - DAY_START_HOUR) * 2;

    return (
      <div className="overflow-x-auto">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid" style={{ gridTemplateColumns: `56px repeat(${gridDays.length}, 1fr)` }}>
            <div className="border-b" />
            {gridDays.map((day) => {
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={cn('border-b border-l px-2 py-2 text-center', isToday && 'bg-accent/40')}>
                  <p className="text-xs text-muted-foreground capitalize">{format(day, 'EEE', { locale })}</p>
                  <p className={cn('text-lg font-semibold', isToday && 'text-primary')}>{format(day, 'd')}</p>
                </div>
              );
            })}
          </div>

          {/* Time grid body */}
          <div className="grid relative" style={{ gridTemplateColumns: `56px repeat(${gridDays.length}, 1fr)` }}>
            {/* Hour labels */}
            <div className="relative">
              {hours.map((h) => (
                <div key={h} className="relative" style={{ height: SLOT_HEIGHT * 2 }}>
                  <span className="absolute -top-2 right-1 text-[10px] text-muted-foreground">{`${String(h).padStart(2, '0')}:00`}</span>
                </div>
              ))}
            </div>

            {/* Day columns */}
            {gridDays.map((day) => {
              const dayApps = getAppointmentsForDay(day);
              const isToday = isSameDay(day, new Date());
              return (
                <div key={day.toISOString()} className={cn('relative border-l', isToday && 'bg-accent/20')} style={{ height: totalSlots * SLOT_HEIGHT }}>
                  {/* Drop zones */}
                  {Array.from({ length: totalSlots }).map((_, slotIdx) => {
                    const minutes = DAY_START_HOUR * 60 + slotIdx * 30;
                    return (
                      <div
                        key={slotIdx}
                        className={cn('border-b border-dashed border-border/50', slotIdx % 2 === 0 && 'border-solid')}
                        style={{ height: SLOT_HEIGHT }}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => handleDrop(e, day, minutes)}
                      />
                    );
                  })}

                  {/* Appointment blocks */}
                  {dayApps.map((app) => {
                    const mins = timeToMinutes(app.appointmentTime);
                    const top = ((mins - DAY_START_HOUR * 60) / 30) * SLOT_HEIGHT;
                    if (top < 0 || top > totalSlots * SLOT_HEIGHT - 20) return null;
                    return (
                      <div
                        key={app.id}
                        draggable
                        onDragStart={(e) => {
                          e.dataTransfer.setData('text/appointment-id', app.id);
                          e.dataTransfer.effectAllowed = 'move';
                        }}
                        onClick={() => setSelectedAppointment(app)}
                        className="absolute left-0.5 right-0.5 cursor-grab overflow-hidden rounded px-1.5 py-0.5 text-[10px] leading-tight text-white shadow-sm hover:opacity-90 active:cursor-grabbing"
                        style={{
                          top,
                          height: SLOT_HEIGHT * 2 - 3,
                          backgroundColor: TYPE_HEX[app.appointmentType] ?? '#6b7280',
                        }}
                        title={`${app.appointmentTime} - ${app.visaCase?.client?.fullName ?? ''} @ ${app.appointmentCenter}`}
                        data-testid={`agenda-block-${app.id}`}
                      >
                        <p className="font-semibold truncate">{app.appointmentTime} {app.visaCase?.client?.fullName ?? ''}</p>
                        <p className="truncate opacity-90">{app.appointmentCenter}</p>
                      </div>
                    );
                  })}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    );
  };

  const renderMonthGrid = () => (
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
            onClick={() => { setCurrentDate(day); setViewMode('day'); }}
            className={cn(
              'min-h-24 bg-card p-1 transition-colors cursor-pointer hover:bg-accent/40',
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
                  onClick={(e) => { e.stopPropagation(); setSelectedAppointment(app); }}
                  className="cursor-pointer rounded px-1 py-0.5 text-[10px] leading-tight truncate text-white"
                  style={{ backgroundColor: TYPE_HEX[app.appointmentType] ?? '#6b7280' }}
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
  );

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
              <Button variant="ghost" size="icon" onClick={() => navigateDate('prev')}><ChevronLeft className="h-4 w-4" /></Button>
              <CardTitle className="text-base capitalize" data-testid="calendar-title">{title}</CardTitle>
              <Button variant="ghost" size="icon" onClick={() => navigateDate('next')}><ChevronRight className="h-4 w-4" /></Button>
              <Button variant="outline" size="sm" className="ml-2 h-7 text-xs" onClick={() => setCurrentDate(new Date())}>
                {t('appointments:today')}
              </Button>
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
            <div className="flex justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : viewMode === 'month' ? renderMonthGrid() : renderTimeGrid()}
        </CardContent>
      </Card>

      <AppointmentDetailDialog
        appointment={selectedAppointment}
        onClose={() => setSelectedAppointment(null)}
        onUpdate={(id, data) => updateMutation.mutate({ id, data })}
        onDelete={(id) => deleteMutation.mutate(id)}
        isUpdating={updateMutation.isPending}
      />

      {/* WhatsApp auto-send prompt after create */}
      <Dialog open={!!whatsappPrompt} onOpenChange={(open) => !open && setWhatsappPrompt(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('appointments:sendWhatsappTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('appointments:sendWhatsappDescription')}</p>
            <div className="rounded-lg border bg-muted/40 p-3 text-sm whitespace-pre-wrap">{whatsappPrompt?.body}</div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setWhatsappPrompt(null)}>{t('common:later')}</Button>
            <Button onClick={() => { if (whatsappPrompt) window.open(whatsappPrompt.url, '_blank'); setWhatsappPrompt(null); }}>
              <MessageCircle className="h-4 w-4 mr-1 text-green-600" />
              {t('appointments:openWhatsapp')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
