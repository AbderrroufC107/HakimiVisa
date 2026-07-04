import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { trackingService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { Loader2, Search, Phone, FileText, Clock, MapPin, Calendar } from 'lucide-react';
import { cn } from '@/lib/utils';
import { VISA_STATUS_COLORS, type VisaStatus } from '@/types';
import type { TrackingCase } from '@/types';

function StatusTimeline({ statusHistories }: { statusHistories: { oldStatus: VisaStatus; newStatus: VisaStatus; changedAt: string }[] }) {
  const { t, i18n } = useTranslation();

  const STEP_LABELS: Record<string, string> = {
    EN_ATTENTE: t('trackingStep:pending'),
    EN_TRAITEMENT: t('trackingStep:processing'),
    RDV_OK: t('status:RDV_OK'),
    VISA_OK: t('trackingStep:VISA_OK'),
    VISA_REFUSEE: t('trackingStep:rejected'),
  };

  const steps: VisaStatus[] = ['EN_ATTENTE', 'EN_TRAITEMENT', 'RDV_OK', 'VISA_OK'];
  const currentStatus = statusHistories ? statusHistories[statusHistories.length - 1]?.newStatus : 'EN_ATTENTE';
  const isRefused = currentStatus === 'VISA_REFUSEE';

  return (
    <div className="space-y-2">
      {steps.map((step, idx) => {
        const historyEntry = statusHistories.find((h) => h.newStatus === step);
        const isActive = step === currentStatus;
        const isPast = steps.indexOf(currentStatus as VisaStatus) >= idx || (isRefused && idx <= steps.indexOf(currentStatus as VisaStatus));
        const isLast = idx === steps.length - 1;

        return (
          <div key={step} className="flex items-start gap-4 relative">
            {!isLast && (
              <div 
                className={cn('absolute left-[11px] top-6 bottom-[-8px] w-0.5', isPast ? 'bg-green-500' : 'bg-muted')} 
              />
            )}
            <div className="flex flex-col items-center relative z-10">
              <div className={cn(
                'flex h-6 w-6 items-center justify-center rounded-full text-xs font-bold',
                isActive ? 'bg-primary text-primary-foreground' : isPast ? 'bg-green-500 text-white' : 'bg-muted text-muted-foreground',
              )}>
                {isPast ? '✓' : idx + 1}
              </div>
            </div>
            <div className="pb-6">
              <p className={cn('text-sm font-medium', isActive ? 'text-foreground' : 'text-muted-foreground')}>
                {STEP_LABELS[step]}
              </p>
              {historyEntry && (
                <p className="text-xs text-muted-foreground">
                  {new Date(historyEntry.changedAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}
                </p>
              )}
            </div>
          </div>
        );
      })}
      {isRefused && (() => {
        const refusedHistory = statusHistories.find((h) => h.newStatus === 'VISA_REFUSEE');
        return (
          <div className="flex items-start gap-3">
            <div className="flex h-6 w-6 items-center justify-center rounded-full bg-red-500 text-white text-xs font-bold">✕</div>
            <div>
              <p className="text-sm font-medium text-red-600">{t('trackingStep:rejected')}</p>
              {refusedHistory && (
                <p className="text-xs text-muted-foreground">
                  {new Date(refusedHistory.changedAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}
                </p>
              )}
            </div>
          </div>
        );
      })()}
    </div>
  );
}

export function TrackingPage() {
  const { t, i18n } = useTranslation();
  const [phone, setPhone] = useState('');
  const [searchedPhone, setSearchedPhone] = useState('');
  const [selectedCase, setSelectedCase] = useState<TrackingCase | null>(null);

  const { data: searchResult, isLoading, isError, error } = useQuery({
    queryKey: ['tracking', searchedPhone],
    queryFn: () => trackingService.findByPhone(searchedPhone),
    enabled: searchedPhone.length >= 8,
    retry: false,
  });

  const { data: caseDetail, isLoading: detailLoading } = useQuery({
    queryKey: ['tracking-detail', selectedCase?.id],
    queryFn: () => trackingService.findOne(selectedCase!.id),
    enabled: !!selectedCase,
  });

  const handleSearch = () => {
    if (phone.length < 8) return;
    setSearchedPhone(phone);
    setSelectedCase(null);
  };

  return (
    <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold text-gray-900" data-testid="tracking-heading">{t('tracking:title')}</h1>
          <p className="mt-2 text-gray-600">{t('tracking:description')}</p>
        </div>

        <Card className="mb-8">
          <CardContent className="pt-6">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <Input
                  data-testid="tracking-phone-input"
                  placeholder={t('tracking:enterNumber')}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                  className="pl-9"
                />
              </div>
              <Button data-testid="tracking-search-btn" onClick={handleSearch} disabled={phone.length < 8}>
                <Search className="h-4 w-4 mr-1" />
                {t('common:search')}
              </Button>
            </div>
          </CardContent>
        </Card>

        {isLoading && (
          <div className="flex justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        )}

        {isError && !isLoading && (
          <Card data-testid="tracking-error">
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">{error && 'message' in error && (error as { message: string }).message === 'Aucun dossier trouvé avec ce numéro de téléphone'
                ? t('tracking:noCaseFound')
                : t('tracking:searchError')}
              </p>
            </CardContent>
          </Card>
        )}

        {searchResult && !selectedCase && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">{t('tracking:caseDetails')}</CardTitle>
              <p className="text-sm text-muted-foreground">{t('tracking:casesFound', { count: searchResult.total })}</p>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {searchResult.cases.map((c) => (
                  <div
                    key={c.id}
                    className="flex cursor-pointer items-center justify-between rounded-lg border p-4 transition-shadow hover:shadow-md"
                    onClick={() => setSelectedCase(c)}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                        <span className="font-mono text-sm font-semibold">{c.caseNumber}</span>
                      </div>
                      <p className="mt-1 text-sm text-muted-foreground">{c.visaCountry} - {c.visaType}</p>
                      <p className="text-xs text-muted-foreground">{t('tracking:lastUpdate')}: {new Date(c.updatedAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</p>
                    </div>
                    <Badge className={VISA_STATUS_COLORS[c.currentStatus]}>{t('status:' + c.currentStatus)}</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {selectedCase && (
          <div className="space-y-4">
            <Button variant="ghost" onClick={() => setSelectedCase(null)}>
              ← {t('common:backToList')}
            </Button>

            {detailLoading ? (
              <div className="flex justify-center py-8"><Loader2 className="h-6 w-6 animate-spin" /></div>
            ) : caseDetail ? (
              <>
                <Card>
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">{caseDetail.caseNumber}</CardTitle>
                      <Badge className={VISA_STATUS_COLORS[caseDetail.currentStatus]}>
                        {t('status:' + caseDetail.currentStatus)}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4 text-muted-foreground" />
                      <span className="font-medium">{caseDetail.client.fullName}</span>
                    </div>
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div><span className="text-muted-foreground">{t('visaCases:destinationCountry')}:</span> {caseDetail.visaCountry}</div>
                      <div><span className="text-muted-foreground">{t('visaCases:visaType')}:</span> {caseDetail.visaType}</div>
                      <div><span className="text-muted-foreground">{t('visaCases:submissionDate')}:</span> {new Date(caseDetail.openingDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</div>
                      <div><span className="text-muted-foreground">{t('tracking:lastUpdate')}:</span> {new Date(caseDetail.updatedAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      <CardTitle className="text-base">{t('tracking:statusTimeline')}</CardTitle>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <StatusTimeline statusHistories={caseDetail.statusHistories ?? []} />
                  </CardContent>
                </Card>

                {caseDetail.appointments.length > 0 && (
                  <Card>
                    <CardHeader>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <CardTitle className="text-base">{t('tracking:appointments')}</CardTitle>
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        {caseDetail.appointments.map((app) => (
                          <div key={app.id} className="rounded-lg border p-3">
                            <p className="text-sm font-medium">
                              {new Date(app.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')} à {app.appointmentTime}
                            </p>
                            <div className="flex items-center gap-2 mt-1 text-xs text-muted-foreground">
                              <MapPin className="h-3 w-3" />
                              {app.appointmentCenter} - {t('appointmentType:' + app.appointmentType)}
                            </div>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                )}

                {caseDetail.visaDetails && (
                  <Card>
                    <CardHeader>
                      <CardTitle className="text-base">{t('visaCases:visaDetails')}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-2 gap-3 text-sm">
                        <div><span className="text-muted-foreground">{t('visaCases:validFrom')}:</span> {new Date(caseDetail.visaDetails.validFrom).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</div>
                        <div><span className="text-muted-foreground">{t('visaCases:validUntil')}:</span> {new Date(caseDetail.visaDetails.validUntil).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</div>
                        <div><span className="text-muted-foreground">{t('visaCases:duration')}:</span> {caseDetail.visaDetails.durationDays} {t('tracking:days')}</div>
                        <div><span className="text-muted-foreground">{t('visaCases:entry')}:</span> {caseDetail.visaDetails.entryType === 'MULTIPLE' ? t('entryType:MULTIPLE') : t('entryType:SINGLE')}</div>
                        {caseDetail.visaDetails.visaNumber && (
                          <div className="col-span-2"><span className="text-muted-foreground">{t('visaCases:visaNumber')}:</span> {caseDetail.visaDetails.visaNumber}</div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                )}
              </>
            ) : null}
          </div>
        )}

        {!searchResult && !isLoading && !isError && searchedPhone.length === 0 && (
          <Card data-testid="tracking-empty-state">
            <CardContent className="py-12 text-center">
              <Search className="mx-auto h-12 w-12 text-muted-foreground/40" />
              <p className="mt-4 text-muted-foreground">{t('tracking:startSearch')}</p>
            </CardContent>
          </Card>
        )}
    </div>
  );
}
