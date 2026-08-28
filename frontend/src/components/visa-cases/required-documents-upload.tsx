import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { CheckCircle2, Loader2, Trash2, Upload, FileText, ListChecks } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { requiredDocumentsService, visaCaseFilesService } from '@/services';
import { cn } from '@/lib/utils';
import type { ClientFile } from '@/services/client-files';

interface Props {
  visaCaseId: string;
  country?: string;
  visaType?: string;
}

function humanSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

/**
 * One upload slot per document the desk requires for this country and visa
 * type. A partner agency files against a named slot rather than a free-form
 * drop zone, so nothing is missed and nobody has to guess what to send.
 */
export function RequiredDocumentsUpload({ visaCaseId, country, visaType }: Props) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const inputs = useRef<Record<string, HTMLInputElement | null>>({});
  const [busySlot, setBusySlot] = useState<string | null>(null);

  const { data: required = [], isLoading } = useQuery({
    queryKey: ['required-documents', 'for-case', country, visaType],
    queryFn: () => requiredDocumentsService.forCase(country, visaType),
  });

  const { data: files = [] } = useQuery({
    queryKey: ['visa-case-files', visaCaseId],
    queryFn: () => visaCaseFilesService.getFiles(visaCaseId),
    enabled: !!visaCaseId,
  });

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ['visa-case-files', visaCaseId] });

  const uploadMutation = useMutation({
    mutationFn: ({ file, requiredDocumentId }: { file: File; requiredDocumentId: string }) =>
      visaCaseFilesService.uploadFile(visaCaseId, file, requiredDocumentId),
    onSuccess: () => {
      invalidate();
      toast.success(t('clients:uploadSuccess'));
    },
    onError: (e: Error) => toast.error(e.message || t('clients:uploadFailed')),
    onSettled: () => setBusySlot(null),
  });

  const deleteMutation = useMutation({
    mutationFn: (fileId: string) => visaCaseFilesService.deleteFile(visaCaseId, fileId),
    onSuccess: () => {
      invalidate();
      toast.success(t('common:success'));
    },
    onError: (e: Error) => toast.error(e.message || t('common:error')),
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-8">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  // Nothing is required for this combination yet. The desk has not said what it
  // wants, and showing an empty checklist would read as "send nothing".
  if (required.length === 0) {
    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-base">
            <ListChecks className="h-4 w-4 text-primary" />
            {t('requiredDocs:uploadTitle')}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">{t('requiredDocs:noneForCase')}</p>
        </CardContent>
      </Card>
    );
  }

  const fileFor = (requiredId: string): ClientFile | undefined =>
    files.find((f) => f.requiredDocumentId === requiredId);

  const done = required.filter((r) => fileFor(r.id)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          {t('requiredDocs:uploadTitle')}
          <span className="ml-auto text-sm font-normal tabular-nums text-muted-foreground">
            {done}/{required.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-2">
        {required.map((item) => {
          const existing = fileFor(item.id);
          const busy = busySlot === item.id && uploadMutation.isPending;

          return (
            <div
              key={item.id}
              data-testid={`upload-slot-${item.id}`}
              data-filled={existing ? 'true' : 'false'}
              className={cn(
                'flex items-center gap-3 rounded-lg border p-3 transition-colors',
                existing ? 'border-emerald-300 bg-emerald-50/60' : 'border-dashed',
              )}
            >
              {existing ? (
                <CheckCircle2 className="h-5 w-5 shrink-0 text-emerald-600" />
              ) : (
                <FileText className="h-5 w-5 shrink-0 text-muted-foreground/60" />
              )}

              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium">{item.label}</p>
                {existing ? (
                  <p className="truncate text-xs text-muted-foreground">
                    {existing.originalName} · {humanSize(existing.size)}
                  </p>
                ) : (
                  <p className="text-xs text-muted-foreground">{t('requiredDocs:slotEmpty')}</p>
                )}
              </div>

              <input
                type="file"
                hidden
                ref={(el) => {
                  inputs.current[item.id] = el;
                }}
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  e.target.value = '';
                  if (!file) return;
                  setBusySlot(item.id);
                  uploadMutation.mutate({ file, requiredDocumentId: item.id });
                }}
              />

              {existing && (
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={t('common:delete')}
                  onClick={() => deleteMutation.mutate(existing.id)}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              )}

              <Button
                variant={existing ? 'outline' : 'default'}
                size="sm"
                disabled={busy}
                data-testid={`upload-btn-${item.id}`}
                onClick={() => inputs.current[item.id]?.click()}
              >
                {busy ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Upload className="mr-1 h-3.5 w-3.5" />
                )}
                {existing ? t('requiredDocs:replace') : t('common:upload')}
              </Button>
            </div>
          );
        })}
      </CardContent>
    </Card>
  );
}
