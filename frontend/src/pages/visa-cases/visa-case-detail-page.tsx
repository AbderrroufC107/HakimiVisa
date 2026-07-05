import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Printer, FileText, Loader2 } from 'lucide-react';
import { DetailSkeleton } from '@/components/shared';
import { visaCasesService, pdfService, visaDetailsService, appointmentsService } from '@/services';
import { ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { VISA_STATUS_COLORS, type VisaStatus, type EntryType } from '@/types';
import { useTranslation } from 'react-i18next';

const STATUS_OPTIONS: VisaStatus[] = ['EN_ATTENTE', 'EN_TRAITEMENT', 'RDV_OK', 'VISA_OK', 'VISA_REFUSEE'];

export function VisaCaseDetailPage() {
  const { t, i18n } = useTranslation();
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  const [printing, setPrinting] = useState(false);

  const handlePrint = useCallback(async () => {
    if (!id || printing) return;
    setPrinting(true);
    try {
      await pdfService.printBordereau(id);
    } catch {
      toast.error(t('common:error'));
    } finally {
      setPrinting(false);
    }
  }, [id, printing, t]);

  const { data, isLoading } = useQuery({
    queryKey: ['visa-case', id],
    queryFn: () => visaCasesService.findOne(id!),
    enabled: !!id,
  });

  const visaCase = data;

  const { data: visaDetails } = useQuery({
    queryKey: ['visa-details', id],
    queryFn: () => visaDetailsService.findByVisaCase(id!),
    enabled: !!id && visaCase?.currentStatus === 'VISA_OK',
  });

  const { data: appointments = null } = useQuery({
    queryKey: ['appointments', 'by-case', id],
    queryFn: () => appointmentsService.findAll({ visaCaseId: id! }),
    enabled: !!id,
  });

  const statusMutation = useMutation({
    mutationFn: (status: VisaStatus) => visaCasesService.updateStatus(id!, { status }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-case', id] });
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      toast.success(t('visaCases:statusUpdated'));
      setSelectedStatus('');
    },
    onError: () => toast.error(t('visaCases:updateFailed')),
  });

  const createVisaDetailsMutation = useMutation({
    mutationFn: (data: { validFrom: string; validUntil: string; durationDays: number; entryType: EntryType; visaNumber?: string; notes?: string }) =>
      visaDetailsService.create(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-details', id] });
      toast.success(t('visaCases:detailsAdded'));
    },
    onError: () => toast.error(t('common:error')),
  });

  const [vdForm, setVdForm] = useState({
    validFrom: '',
    validUntil: '',
    durationDays: 30,
    entryType: 'SINGLE' as EntryType,
    visaNumber: '',
    notes: '',
  });

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!visaCase) {
    return <div className="py-16 text-center text-muted-foreground">{t('visaCases:caseNotFound')}</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(ROUTES.VISA_CASES)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div>
            <div className="flex items-center gap-3">
              <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{visaCase.caseNumber}</h1>
              <Badge className={VISA_STATUS_COLORS[visaCase.currentStatus]}>
                {t('status:' + visaCase.currentStatus)}
              </Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              {t('common:createdOn')} {new Date(visaCase.createdAt).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button data-testid="bordereau-print" variant="default" size="sm" disabled={printing} onClick={handlePrint}>
            {printing ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Printer className="h-4 w-4 mr-1" />}
            {t('common:print')}
          </Button>
        </div>
      </div>

      <div className="flex items-center gap-4 rounded-lg border p-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{t('common:status')}</p>
        </div>
        <Select value={selectedStatus} onValueChange={(value) => statusMutation.mutate(value as VisaStatus)}>
          <SelectTrigger className="w-[200px]" data-testid="status-select">
            <SelectValue placeholder={t('visaCases:selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} data-testid={`status-option-${s}`}>{t('status:' + s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('visaCases:visaDetails')}</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('clients:client')}</span>
              <span className="text-sm font-medium cursor-pointer hover:underline" onClick={() => navigate(ROUTES.CLIENTS_DETAIL(visaCase.clientId))}>
                {visaCase.client?.fullName ?? '—'}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('visaCases:phone')}</span>
              <span className="text-sm font-medium">{visaCase.client?.phoneNumber ?? '—'}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('visaCases:country')}</span>
              <span className="text-sm font-medium">{visaCase.visaCountry}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('visaCases:visaType')}</span>
              <span className="text-sm font-medium">{visaCase.visaType}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('common:createdAt')}</span>
              <span className="text-sm font-medium">{new Date(visaCase.openingDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-muted-foreground">{t('visaCases:createdBy')}</span>
              <span className="text-sm font-medium">{visaCase.creator?.firstName} {visaCase.creator?.lastName}</span>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{t('common:notes')}</CardTitle></CardHeader>
          <CardContent>
            {visaCase.notes ? (
              <p className="text-sm whitespace-pre-wrap">{visaCase.notes}</p>
            ) : (
              <p className="text-sm text-muted-foreground">{t('visaCases:noNotes')}</p>
            )}
          </CardContent>
        </Card>
      </div>

      {visaCase.currentStatus === 'VISA_OK' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <CardTitle>{t('visaCases:visaDetails')} ({t('visaCases:approved')})</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            {visaDetails ? (
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                <div>
                  <p className="text-xs text-muted-foreground">{t('visaCases:validFrom')}</p>
                  <p className="text-sm font-medium">{new Date(visaDetails.validFrom).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('visaCases:validUntil')}</p>
                  <p className="text-sm font-medium">{new Date(visaDetails.validUntil).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('visaCases:durationDays')}</p>
                  <p className="text-sm font-medium">{visaDetails.durationDays}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('visaCases:entryType')}</p>
                  <p className="text-sm font-medium">{visaDetails.entryType === 'MULTIPLE' ? t('entryType:MULTIPLE') : t('entryType:SINGLE')}</p>
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{t('visaCases:visaNumber')}</p>
                  <p className="text-sm font-medium">{visaDetails.visaNumber || '-'}</p>
                </div>
                {visaDetails.notes && (
                  <div className="sm:col-span-3">
                    <p className="text-xs text-muted-foreground">{t('common:notes')}</p>
                    <p className="text-sm">{visaDetails.notes}</p>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">{t('visaCases:addVisaDetails')}</p>
                <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                  <div className="space-y-1">
                    <Label className="text-xs">{t('visaCases:validFrom')}</Label>
                    <Input type="date" size={1} value={vdForm.validFrom} onChange={(e) => setVdForm({ ...vdForm, validFrom: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('visaCases:validUntil')}</Label>
                    <Input type="date" value={vdForm.validUntil} onChange={(e) => setVdForm({ ...vdForm, validUntil: e.target.value })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('visaCases:durationDays')}</Label>
                    <Input type="number" min={1} value={vdForm.durationDays} onChange={(e) => setVdForm({ ...vdForm, durationDays: Number(e.target.value) })} />
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('visaCases:entryType')}</Label>
                    <Select value={vdForm.entryType} onValueChange={(v: EntryType) => setVdForm({ ...vdForm, entryType: v })}>
                      <SelectTrigger><SelectValue /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="SINGLE">{t('entryType:SINGLE')}</SelectItem>
                        <SelectItem value="MULTIPLE">{t('entryType:MULTIPLE')}</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-1">
                    <Label className="text-xs">{t('visaCases:visaNumber')}</Label>
                    <Input value={vdForm.visaNumber} onChange={(e) => setVdForm({ ...vdForm, visaNumber: e.target.value })} />
                  </div>
                </div>
                <div className="space-y-1">
                  <Label className="text-xs">{t('common:notes')}</Label>
                  <Input value={vdForm.notes} onChange={(e) => setVdForm({ ...vdForm, notes: e.target.value })} />
                </div>
                <Button size="sm" onClick={() => {
                  if (!vdForm.validFrom || !vdForm.validUntil) { toast.error(t('visaCases:requiredFields')); return; }
                  createVisaDetailsMutation.mutate(vdForm);
                }}>
                  {t('visaCases:saveDetails')}
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {appointments && appointments.length > 0 && (
        <Card>
          <CardHeader><CardTitle>{t('nav:appointments')}</CardTitle></CardHeader>
          <CardContent>
            <div className="space-y-2">
              {appointments.map((app) => (
                <div key={app.id} className="flex items-center justify-between rounded-lg border p-3">
                  <div>
                    <p className="text-sm font-medium">
                      {new Date(app.appointmentDate).toLocaleDateString(i18n.language?.replace('_', '-') ?? 'en-US')} à {app.appointmentTime}
                    </p>
                    <p className="text-xs text-muted-foreground">{app.appointmentCenter} - {t('appointmentType:' + app.appointmentType)}</p>
                  </div>
                  {app.notes && <p className="text-xs text-muted-foreground max-w-[200px] truncate">{app.notes}</p>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <Card>
        <CardHeader>
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <CardTitle>{t('visaCases:updateHistory')}</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {!visaCase.statusHistories || visaCase.statusHistories.length === 0 ? (
            <p className="py-4 text-center text-sm text-muted-foreground">{t('visaCases:noStatusChanges')}</p>
          ) : (
            <div className="space-y-3">
              {visaCase.statusHistories.map((h) => (
                <div key={h.id} className="flex items-center gap-3 text-sm">
                  <div className="flex items-center gap-1">
                    <Badge className={VISA_STATUS_COLORS[h.oldStatus]}>{t('status:' + h.oldStatus)}</Badge>
                    <span className="text-muted-foreground">→</span>
                    <Badge className={VISA_STATUS_COLORS[h.newStatus]}>{t('status:' + h.newStatus)}</Badge>
                  </div>
                  <span className="text-xs text-muted-foreground ml-auto">
                    {h.changer?.firstName} {h.changer?.lastName} · {new Date(h.changedAt).toLocaleString(i18n.language?.replace('_', '-') ?? 'en-US')}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
