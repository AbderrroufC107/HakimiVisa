import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { type VisaStatus } from '@/types';

interface BulkStatusChangeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: (status: string) => void;
}

const STATUSES: VisaStatus[] = ['EN_ATTENTE', 'EN_TRAITEMENT', 'RDV_OK', 'VISA_OK', 'VISA_REFUSEE'];

export function BulkStatusChangeDialog({ open, onOpenChange, count, onConfirm }: BulkStatusChangeDialogProps) {
  const { t } = useTranslation();
  const [selected, setSelected] = useState<VisaStatus | ''>('');

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => onOpenChange(false)}>
      <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">{t('dialog:bulkStatusTitle', { count })}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{t('dialog:bulkStatusDesc')}</p>

        <div className="mt-4 space-y-2">
          {STATUSES.map((status) => (
            <label
              key={status}
              className={`flex cursor-pointer items-center gap-3 rounded-lg border p-3 transition-colors hover:bg-muted/50 ${
                selected === status ? 'border-primary bg-primary/5' : ''
              }`}
            >
              <input
                type="radio"
                name="bulk-status"
                value={status}
                checked={selected === status}
                onChange={() => setSelected(status)}
                className="h-4 w-4 accent-primary"
              />
              <span className="text-sm font-medium">{t(`status:${status}`)}</span>
            </label>
          ))}
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>{t('common:cancel')}</Button>
          <Button onClick={() => selected && onConfirm(selected)} disabled={!selected}>
            {t('dialog:bulkStatusUpdate', { count })}
          </Button>
        </div>
      </div>
    </div>
  );
}
