import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { AlertTriangle } from 'lucide-react';

interface BulkDeleteConfirmDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  count: number;
  onConfirm: () => void;
}

export function BulkDeleteConfirmDialog({ open, onOpenChange, count, onConfirm }: BulkDeleteConfirmDialogProps) {
  const { t } = useTranslation();
  const [step, setStep] = useState<'confirm' | 'final'>('confirm');

  if (!open) return null;

  const handleClose = () => {
    setStep('confirm');
    onOpenChange(false);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={handleClose}>
      <div className="mx-4 w-full max-w-md rounded-lg border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        {step === 'confirm' ? (
          <>
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{t('dialog:bulkDeleteTitle', { count })}</h3>
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              <strong>{t('dialog:bulkDeleteWarning', { count })}</strong>
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>{t('common:cancel')}</Button>
              <Button variant="destructive" onClick={() => setStep('final')}>
                {t('common:continue')}
              </Button>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3 text-destructive">
              <AlertTriangle className="h-6 w-6" />
              <h3 className="text-lg font-semibold">{t('dialog:bulkDeleteFinal')}</h3>
            </div>
            <p className="mt-2 text-sm text-destructive font-medium">
              {t('dialog:bulkDeleteFinalWarning', { count })}
            </p>
            <div className="mt-6 flex justify-end gap-2">
              <Button variant="outline" onClick={handleClose}>{t('common:cancel')}</Button>
              <Button variant="destructive" onClick={() => { onConfirm(); handleClose(); }}>
                {t('dialog:bulkDeleteConfirm', { count })}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
