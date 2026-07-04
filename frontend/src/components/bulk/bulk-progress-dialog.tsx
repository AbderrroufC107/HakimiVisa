import { useTranslation } from 'react-i18next';
import { Loader2 } from 'lucide-react';

interface BulkProgressDialogProps {
  open: boolean;
  current: number;
  total: number;
  label?: string;
}

export function BulkProgressDialog({ open, current, total, label }: BulkProgressDialogProps) {
  const { t } = useTranslation();

  if (!open) return null;

  const pct = total > 0 ? Math.round((current / total) * 100) : 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="mx-4 w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
        <div className="flex items-center gap-3">
          <Loader2 className="h-5 w-5 animate-spin text-primary" />
          <span className="text-sm font-medium">{label ?? t('dialog:bulkProgress')}</span>
        </div>
        {total > 1 && (
          <div className="mt-4">
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>{current} / {total}</span>
              <span>{pct}%</span>
            </div>
            <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-muted">
              <div
                className="h-full rounded-full bg-primary transition-all duration-300"
                style={{ width: `${pct}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
