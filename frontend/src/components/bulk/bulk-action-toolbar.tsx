import { useState, useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { X, CheckCircle2, Calendar, FileDown, FileSpreadsheet, Trash2, Archive } from 'lucide-react';
import { BulkStatusChangeDialog } from './bulk-status-change-dialog';
import { BulkAppointmentDialog } from './bulk-appointment-dialog';
import { BulkProgressDialog } from './bulk-progress-dialog';
import { BulkDeleteConfirmDialog } from './bulk-delete-confirm-dialog';
import { bulkService, type BulkResult } from '@/services/bulk';
import { cn } from '@/lib/utils';

interface BulkActionToolbarProps {
  selectedIds: string[];
  onClearSelection: () => void;
  onRefresh: () => void;
  className?: string;
}

export function BulkActionToolbar({ selectedIds, onClearSelection, onRefresh, className }: BulkActionToolbarProps) {
  const { t } = useTranslation();
  const [statusDialogOpen, setStatusDialogOpen] = useState(false);
  const [appointmentDialogOpen, setAppointmentDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [progress, setProgress] = useState({ current: 0, total: selectedIds.length });
  const [result, setResult] = useState<BulkResult | null>(null);

  const count = selectedIds.length;

  const handleStatusChange = useCallback(async (status: string) => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    setStatusDialogOpen(false);
    try {
      const res = await bulkService.statusChange({ ids: selectedIds, status });
      setResult(res);
      if (res.failed === 0) onRefresh();
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count, onRefresh]);

  const handleAppointment = useCallback(async (data: { appointmentDate: string; appointmentTime: string; appointmentCenter: string; appointmentType: string; notes?: string }) => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    setAppointmentDialogOpen(false);
    try {
      const res = await bulkService.createAppointments({ ids: selectedIds, ...data });
      setResult(res);
      if (res.failed === 0) onRefresh();
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count, onRefresh]);

  const handlePdfExport = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    try {
      const blob = await bulkService.exportPdf({ ids: selectedIds });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bordereaux-${Date.now()}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
      setResult({ total: count, successful: count, failed: 0, items: selectedIds.map((id) => ({ id, success: true })) });
    } catch {
      setResult({ total: count, successful: 0, failed: count, items: selectedIds.map((id) => ({ id, success: false, error: t('common:error') })) });
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count]);

  const handleExcelExport = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    try {
      const blob = await bulkService.exportExcel({ ids: selectedIds });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `bulk-export-${Date.now()}.xlsx`;
      a.click();
      window.URL.revokeObjectURL(url);
      setResult({ total: count, successful: count, failed: 0, items: selectedIds.map((id) => ({ id, success: true })) });
    } catch {
      setResult({ total: count, successful: 0, failed: count, items: selectedIds.map((id) => ({ id, success: false, error: t('common:error') })) });
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count]);

  const handleArchive = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    try {
      const res = await bulkService.archive({ ids: selectedIds });
      setResult(res);
      if (res.failed === 0) onRefresh();
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count, onRefresh]);

  const handleDelete = useCallback(async () => {
    setProcessing(true);
    setProgress({ current: 0, total: count });
    setDeleteDialogOpen(false);
    try {
      const res = await bulkService.delete({ ids: selectedIds });
      setResult(res);
      if (res.failed === 0) onRefresh();
    } finally {
      setProcessing(false);
    }
  }, [selectedIds, count, onRefresh]);

  if (count === 0 && !result) return null;

  return (
    <>
      {count > 0 && !result && (
        <div className={cn('flex items-center gap-2 rounded-lg border bg-primary/5 px-4 py-2 text-sm', className)}>
          <span className="font-medium">{t('table:selected', { count })}</span>
          <div className="ml-2 flex flex-wrap items-center gap-1.5">
            <Button variant="outline" size="sm" onClick={() => setStatusDialogOpen(true)}>
              <CheckCircle2 className="mr-1.5 h-3.5 w-3.5" /> {t('common:status')}
            </Button>
            <Button variant="outline" size="sm" onClick={() => setAppointmentDialogOpen(true)}>
              <Calendar className="mr-1.5 h-3.5 w-3.5" /> {t('nav:appointments')}
            </Button>
            <Button variant="outline" size="sm" onClick={handlePdfExport}>
              <FileDown className="mr-1.5 h-3.5 w-3.5" /> {t('common:pdf')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleExcelExport}>
              <FileSpreadsheet className="mr-1.5 h-3.5 w-3.5" /> {t('common:excel')}
            </Button>
            <Button variant="outline" size="sm" onClick={handleArchive}>
              <Archive className="mr-1.5 h-3.5 w-3.5" /> {t('common:archive')}
            </Button>
            <Button variant="destructive" size="sm" onClick={() => setDeleteDialogOpen(true)}>
              <Trash2 className="mr-1.5 h-3.5 w-3.5" /> {t('common:delete')}
            </Button>
          </div>
          <Button variant="ghost" size="sm" className="ml-auto" onClick={onClearSelection}>
            <X className="h-4 w-4" />
          </Button>
        </div>
      )}

      <BulkStatusChangeDialog
        open={statusDialogOpen}
        onOpenChange={setStatusDialogOpen}
        count={count}
        onConfirm={handleStatusChange}
      />

      <BulkAppointmentDialog
        open={appointmentDialogOpen}
        onOpenChange={setAppointmentDialogOpen}
        count={count}
        onConfirm={handleAppointment}
      />

      <BulkDeleteConfirmDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        count={count}
        onConfirm={handleDelete}
      />

      <BulkProgressDialog
        open={processing}
        current={progress.current}
        total={progress.total}
        label={t('dialog:bulkProgress')}
      />

      {result && (
        <BulkResultReportInner
          result={result}
          onClose={() => { setResult(null); onClearSelection(); }}
        />
      )}
    </>
  );
}

function BulkResultReportInner({ result, onClose }: { result: BulkResult; onClose: () => void }) {
  const { t } = useTranslation();
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={onClose}>
      <div className="mx-4 w-full max-w-lg rounded-lg border bg-background p-6 shadow-lg" onClick={(e) => e.stopPropagation()}>
        <h3 className="text-lg font-semibold">{t('dialog:bulkOperationComplete')}</h3>
        <div className="mt-4 space-y-2 text-sm">
          <div className="flex items-center gap-2 text-green-600">
            <CheckCircle2 className="h-4 w-4" />
            <span>{t('dialog:bulkSuccessful', { count: result.successful })}</span>
          </div>
          {result.failed > 0 && (
            <>
              <div className="flex items-center gap-2 text-destructive">
                <X className="h-4 w-4" />
                <span>{t('dialog:bulkFailed', { count: result.failed })}</span>
              </div>
              <div className="mt-2 max-h-32 space-y-1 overflow-y-auto rounded border bg-muted/50 p-2">
                {result.items.filter((i) => !i.success).map((item) => (
                  <div key={item.id} className="text-xs text-destructive">
                    {item.caseNumber ?? item.id}: {item.error}
                  </div>
                ))}
              </div>
            </>
          )}
        </div>
        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={onClose}>{t('dialog:close')}</Button>
        </div>
      </div>
    </div>
  );
}
