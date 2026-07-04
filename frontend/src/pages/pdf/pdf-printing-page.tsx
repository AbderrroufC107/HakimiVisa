import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Printer, FileText } from 'lucide-react';
import { visaCasesService, pdfService } from '@/services';
import { Badge } from '@/components/shared/badge';
import { VISA_STATUS_COLORS } from '@/types';

export function PdfPrintingPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');

  const { data: result, isLoading } = useQuery({
    queryKey: ['visa-cases', { limit: 100 }],
    queryFn: () => visaCasesService.findAll({ limit: 100 }),
  });

  const cases = result?.data || [];

  const filtered = cases.filter((c) => {
    if (search && !c.caseNumber.toLowerCase().includes(search.toLowerCase()) && !c.client?.fullName.toLowerCase().includes(search.toLowerCase())) {
      return false;
    }
    return true;
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('pdf:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('pdf:subtitle')}</p>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('pdf:searchPlaceholder')}
            className="pl-9 h-9"
          />
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton-shimmer h-8 w-8 rounded" />
                  <div className="skeleton-shimmer h-4 flex-1 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">{t('pdf:noCasesFound')}</div>
          ) : (
            <div className="divide-y text-sm">
              {filtered.map((c) => (
                <div key={c.id} className="flex items-center justify-between px-4 py-3 hover:bg-muted/30">
                  <div className="flex items-center gap-4">
                    <div className="shrink-0">
                      <FileText className="h-5 w-5 text-muted-foreground" />
                    </div>
                    <div className="w-32 font-mono font-medium">{c.caseNumber}</div>
                    <div className="w-48 font-medium">{c.client?.fullName}</div>
                    <div className="w-32 text-muted-foreground">{c.visaCountry}</div>
                    <div className="w-32">
                      <Badge className={VISA_STATUS_COLORS[c.currentStatus]}>
                        {t('status:' + c.currentStatus)}
                      </Badge>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="default" size="sm" onClick={() => pdfService.printBordereau(c.id)}>
                      <Printer className="h-4 w-4 mr-1" />
                      {t('common:print')}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
