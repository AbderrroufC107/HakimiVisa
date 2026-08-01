import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Calendar, Loader2, Pencil } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { appointmentsService } from '@/services';
import type { AppointmentType, VisaCaseAppointment } from '@/types';

interface AppointmentPickerProps {
  visaCaseId: string;
  appointment?: VisaCaseAppointment | null;
  variant?: 'card' | 'full';
}

const APPOINTMENT_TYPES: AppointmentType[] = ['TLS', 'VFS', 'EMBASSY', 'BIOMETRICS', 'INTERVIEW', 'OTHER'];

function toDateInputValue(dateStr: string): string {
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return '';
  const year = d.getUTCFullYear();
  const month = String(d.getUTCMonth() + 1).padStart(2, '0');
  const day = String(d.getUTCDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function AppointmentPicker({
  visaCaseId,
  appointment,
  variant = 'full',
}: AppointmentPickerProps) {
  const { t, i18n } = useTranslation();
  const queryClient = useQueryClient();
  const dateLocale = i18n.language?.replace('_', '-') ?? 'en-US';
  const [open, setOpen] = useState(false);
  const [date, setDate] = useState('');
  const [time, setTime] = useState('');
  const [center, setCenter] = useState('');
  const [type, setType] = useState<AppointmentType>('TLS');

  const mutation = useMutation({
    mutationFn: () => {
      const payload = {
        appointmentDate: new Date(date + 'T00:00:00Z').toISOString(),
        appointmentTime: time,
        appointmentCenter: center,
        appointmentType: type,
      };
      return appointment
        ? appointmentsService.update(appointment.id, payload)
        : appointmentsService.create({ visaCaseId, ...payload });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['kanban', 'board'] });
      queryClient.invalidateQueries({ queryKey: ['appointments'] });
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      toast.success(t('appointments:appointmentUpdated'));
      setOpen(false);
    },
    onError: () => toast.error(t('appointments:updateError')),
  });

  const openDialog = () => {
    setDate(appointment ? toDateInputValue(appointment.appointmentDate) : '');
    setTime(appointment?.appointmentTime ?? '');
    setCenter(appointment?.appointmentCenter ?? '');
    setType((appointment?.appointmentType as AppointmentType) ?? 'TLS');
    setOpen(true);
  };

  const isValid = Boolean(date && time && center.trim());

  return (
    <>
      {appointment ? (
        <div
          className={
            variant === 'card'
              ? 'flex items-center justify-between gap-2 rounded-lg border border-border/70 bg-muted/50 px-2 py-1.5'
              : 'flex items-center justify-between gap-2 rounded-lg border bg-muted/50 px-3 py-2'
          }
        >
          <div
            className={
              variant === 'card'
                ? 'flex min-w-0 items-center gap-1.5 text-[11px] font-medium'
                : 'flex min-w-0 items-center gap-2 text-sm font-medium'
            }
          >
            <Calendar className="h-3.5 w-3.5 shrink-0 text-primary" />
            <span className="truncate">
              {new Date(appointment.appointmentDate).toLocaleDateString(dateLocale, {
                day: '2-digit',
                month: 'short',
                year: 'numeric',
              })}{' '}
              {t('kanban:at')} {appointment.appointmentTime}
            </span>
          </div>
          <button
            type="button"
            className="flex shrink-0 items-center gap-1 rounded-md px-1 py-0.5 text-[11px] text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
            onClick={openDialog}
            aria-label={t('kanban:editAppointment')}
          >
            <Pencil className="h-3 w-3" />
          </button>
        </div>
      ) : (
        <Button
          type="button"
          variant="outline"
          size="sm"
          className={variant === 'card' ? 'h-7 w-full px-2 text-xs font-medium' : 'h-8 text-xs'}
          onClick={openDialog}
        >
          <Calendar className="me-1 h-3.5 w-3.5" />
          {t('kanban:setAppointment')}
        </Button>
      )}

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{t('kanban:appointmentTitle')}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 py-2">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('appointments:date')}
              </label>
              <input
                type="date"
                value={date}
                onChange={(e) => setDate(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('appointments:time')}
              </label>
              <input
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('appointments:center')}
              </label>
              <input
                type="text"
                value={center}
                onChange={(e) => setCenter(e.target.value)}
                placeholder={t('appointments:centerPlaceholder')}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">
                {t('appointments:type')}
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as AppointmentType)}
                className="h-9 w-full rounded-md border border-input bg-transparent px-3 text-sm"
              >
                {APPOINTMENT_TYPES.map((aType) => (
                  <option key={aType} value={aType}>
                    {t('appointmentType:' + aType)}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setOpen(false)}>
              {t('common:cancel')}
            </Button>
            <Button
              onClick={() => mutation.mutate()}
              disabled={!isValid || mutation.isPending}
            >
              {mutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-1 animate-spin" />
              ) : (
                <Calendar className="h-4 w-4 mr-1" />
              )}
              {appointment ? t('common:save') : t('appointments:createAppointment')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
