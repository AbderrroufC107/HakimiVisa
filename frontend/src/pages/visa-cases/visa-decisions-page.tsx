import { useState } from 'react';
import { useNavigate } from 'react-router';
import { useQuery } from '@tanstack/react-query';
import { CheckCircle, XCircle } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { visaCasesService } from '@/services';
import { ROUTES } from '@/constants';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SearchBar } from '@/components/shared/search-bar';
import { EmptyState } from '@/components/shared/empty-state';
import type { VisaCase } from '@/types';

export function VisaDecisionsPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [search, setSearch] = useState('');

  const { data: approvedData, isLoading: loadingApproved } = useQuery({
    queryKey: ['visa-cases', 'decisions', 'VISA_OK'],
    queryFn: () => visaCasesService.findAll({ status: 'VISA_OK', limit: 100 }),
  });

  const { data: refusedData, isLoading: loadingRefused } = useQuery({
    queryKey: ['visa-cases', 'decisions', 'VISA_REFUSEE'],
    queryFn: () => visaCasesService.findAll({ status: 'VISA_REFUSEE', limit: 100 }),
  });

  const approvedCases = (approvedData?.data ?? []).filter(
    (c) => !search || c.caseNumber.toLowerCase().includes(search.toLowerCase()) || c.client?.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const refusedCases = (refusedData?.data ?? []).filter(
    (c) => !search || c.caseNumber.toLowerCase().includes(search.toLowerCase()) || c.client?.fullName?.toLowerCase().includes(search.toLowerCase()),
  );

  const isLoading = loadingApproved || loadingRefused;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('visaCases:decisions')}</h1>
        <p className="text-sm text-muted-foreground">
          {t('nav:visaDecisions')}
        </p>
      </div>

      <SearchBar
        value={search}
        onChange={setSearch}
        placeholder={t('visaCases:searchPlaceholder')}
      />

      {isLoading ? (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('common:loading')}</CardContent>
          </Card>
          <Card>
            <CardContent className="py-8 text-center text-muted-foreground">{t('common:loading')}</CardContent>
          </Card>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2">
          <Card>
            <CardHeader className="border-b border-green-100 dark:border-green-900">
              <CardTitle className="flex items-center gap-2 text-green-700 dark:text-green-400">
                <CheckCircle className="h-5 w-5" />
                {t('visaCases:approved')} ({approvedCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {approvedCases.length === 0 ? (
                <EmptyState
                  icon={CheckCircle}
                  title={t('dashboard:noApproved')}
                  description=""
                />
              ) : (
                approvedCases.map((vc) => (
                  <DecisionCard key={vc.id} visaCase={vc} onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))} />
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="border-b border-red-100 dark:border-red-900">
              <CardTitle className="flex items-center gap-2 text-red-700 dark:text-red-400">
                <XCircle className="h-5 w-5" />
                {t('status:VISA_REFUSEE')} ({refusedCases.length})
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 pt-4">
              {refusedCases.length === 0 ? (
                <EmptyState
                  icon={XCircle}
                  title={t('dashboard:noRefused')}
                  description=""
                />
              ) : (
                refusedCases.map((vc) => (
                  <DecisionCard key={vc.id} visaCase={vc} onClick={() => navigate(ROUTES.VISA_CASES_DETAIL(vc.id))} />
                ))
              )}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}

function DecisionCard({ visaCase, onClick }: { visaCase: VisaCase; onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors"
    >
      <div className="flex items-center justify-between">
        <span className="font-mono text-xs font-medium">{visaCase.caseNumber}</span>
        <span className="text-xs text-muted-foreground">{new Date(visaCase.createdAt).toLocaleDateString()}</span>
      </div>
      <p className="text-sm font-medium mt-1">{visaCase.client?.fullName ?? '—'}</p>
      <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
        <span>{visaCase.visaCountry}</span>
        <span>·</span>
        <span>{visaCase.visaType}</span>
      </div>
    </button>
  );
}
