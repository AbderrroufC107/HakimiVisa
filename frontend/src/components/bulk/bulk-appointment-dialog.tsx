import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { type AppointmentType } from '@/types';

interface BulkAppointmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (data: { appointmentDate: string; appointmentTime: string; appointmentCenter: string; appointmentType: string; notes?: string }) => void;
}

const APPOINTMENT_TYPES: AppointmentType[] = ['TLS', 'VFS', 'EMBASSY', 'BIOMETRICS', 'INTERVIEW', 'OTHER'];

export function BulkAppointmentDialog({ open, onOpenChange, count, onConfirm }: BulkAppointmentDialogProps) {
  const { t } = useTranslation();
  const [appointmentDate, setAppointmentDate] = useState('');
  const [appointmentTime, setAppointmentTime] = useState('');
  const [appointmentCenter, setAppointmentCenter] = useState('');
  const [appointmentType, setAppointmentType] = useState('');
  const [notes, setNotes] = useState('');

  if (!open) return null;

  const isValid = appointmentDate && appointmentTime && appointmentCenter && appointmentType;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">{t('dialog:bulkAppointmentTitle', { count })}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('dialog:bulkAppointmentDesc')}</p>

        <div className="mt-4 space-y-3">
          <div>
            <label className="text-sm font-medium">{t('appointments:date')}</label>
            <input
              type="date"
              value={appointmentDate}
              onChange={(e) => setAppointmentDate(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('appointments:time')}</label>
            <input
              type="time"
              value={appointmentTime}
              onChange={(e) => setAppointmentTime(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('appointments:center')}</label>
            <input
              type="text"
              value={appointmentCenter}
              onChange={(e) => setAppointmentCenter(e.target.value)}
              placeholder={t('appointments:centerPlaceholder')}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
          <div>
            <label className="text-sm font-medium">{t('appointments:type')}</label>
            <select
              value={appointmentType}
              onChange={(e) => setAppointmentType(e.target.value)}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            >
              <option value="">{t('common:none')}</option>
              {APPOINTMENT_TYPES.map((type) => (
                <option key={type} value={type}>{t('appointmentType:' + type)}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-sm font-medium">{t('common:notes')}</label>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
              className="mt-1 w-full rounded-md border bg-background px-3 py-2 text-sm"
            />
          </div>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common:cancel')}</Button>
          <Button onClick={() => onConfirm({ appointmentDate, appointmentTime, appointmentCenter, appointmentType, notes })} disabled={!isValid}>
            {t('dialog:bulkAppointmentAssign', { count })}
          </Button>
        </div>
      </div>
    </div>
  );
}
