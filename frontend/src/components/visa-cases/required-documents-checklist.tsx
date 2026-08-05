import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle2, Circle, ListChecks, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { requiredDocumentsService, visaCaseFilesService } from '@/services';
import { cn } from '@/lib/utils';

interface Props {
  visaCaseId: string;
  country?: string;
  visaType?: string;
}

/**
 * What the desk expects with this application, and how much of it has
 * arrived. Ticking is derived from the uploaded file names rather than stored
 * separately, so the list cannot drift from what is actually attached.
 */
export function RequiredDocumentsChecklist({ visaCaseId, country, visaType }: Props) {
  const { t } = useTranslation();

  const { data: required = [], isLoading } = useQuery({
    queryKey: ['required-documents', 'for-case', country, visaType],
    queryFn: () => requiredDocumentsService.forCase(country, visaType),
  });

  const { data: files = [] } = useQuery({
    queryKey: ['visa-case-files', visaCaseId],
    queryFn: () => visaCaseFilesService.getFiles(visaCaseId),
    enabled: !!visaCaseId,
  });

  if (isLoading) {
    return (
      <Card>
        <CardContent className="flex justify-center py-6">
          <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
        </CardContent>
      </Card>
    );
  }

  if (required.length === 0) return null;

  const normalise = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
  const uploaded = files.map((f) => normalise(f.originalName));
  const isSatisfied = (label: string) => {
    const words = normalise(label).split(' ').filter((w) => w.length > 3);
    if (words.length === 0) return false;
    return uploaded.some((name) => words.some((w) => name.includes(w)));
  };

  const done = required.filter((r) => isSatisfied(r.label)).length;

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <ListChecks className="h-4 w-4 text-primary" />
          {t('requiredDocs:checklistTitle')}
          <span className="ml-auto text-sm font-normal text-muted-foreground tabular-nums">
            {done}/{required.length}
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-1.5">
        {required.map((item) => {
          const ok = isSatisfied(item.label);
          return (
            <div key={item.id} className="flex items-center gap-2" data-testid={`checklist-${item.id}`}>
              {ok ? (
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
              ) : (
                <Circle className="h-4 w-4 shrink-0 text-muted-foreground/50" />
              )}
              <span className={cn('text-sm', ok ? 'text-foreground' : 'text-muted-foreground')}>
                {item.label}
              </span>
            </div>
          );
        })}
        <p className="pt-1 text-[11px] text-muted-foreground">{t('requiredDocs:checklistHint')}</p>
      </CardContent>
    </Card>
  );
}
