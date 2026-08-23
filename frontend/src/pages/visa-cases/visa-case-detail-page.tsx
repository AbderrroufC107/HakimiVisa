import { useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { ArrowLeft, Clock, Printer, Loader2, ChevronRight, MessageCircle, Mail, IdCard, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { CaseFilesPanel } from '@/components/visa-cases/case-files-panel';
import { RequiredDocumentsChecklist } from '@/components/visa-cases/required-documents-checklist';
import { DetailSkeleton } from '@/components/shared';
import { AppointmentPicker } from '@/components/kanban/appointment-picker';
import { visaCasesService, appointmentsService, templatesService } from '@/services';
import { LabelDialog, type LabelData } from '@/components/visa-cases/client-label';
import { NEXT_WORKFLOW_STATUS, ROUTES } from '@/constants';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { VISA_STATUS_COLORS, type VisaStatus, type ApiError } from '@/types';
import { useTranslation } from 'react-i18next';
import { useAuth } from '@/providers';

const STATUS_OPTIONS: VisaStatus[] = ['EN_ATTENTE', 'DOSSIER_INCOMPLET', 'EN_TRAITEMENT', 'RDV_OK', 'LIVREE'];

export function VisaCaseDetailPage() {
  const { t, i18n } = useTranslation();
  const { user } = useAuth();
  // An agency deposits and follows; the pipeline belongs to the desk, so the
  // controls that would only earn a 403 are not shown at all.
  const canDecide = user?.role !== 'AGENCY';
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [selectedStatus, setSelectedStatus] = useState<string>('');
  // Printing from here opens the same label, with the same size choices, as
  // the one offered right after a case is created — it is the same document.
  const [showLabelDialog, setShowLabelDialog] = useState(false);
  const [price, setPrice] = useState<string>('');

  const handlePrint = useCallback(() => setShowLabelDialog(true), []);

  const { data, isLoading } = useQuery({
    queryKey: ['visa-case', id],
    queryFn: () => visaCasesService.findOne(id!),
    enabled: !!id,
  });

  const visaCase = data;

  const { data: appointments = null } = useQuery({
    queryKey: ['appointments', 'by-case', id],
    queryFn: () => appointmentsService.findAll({ visaCaseId: id! }),
    enabled: !!id,
  });

  const [incompleteDialogOpen, setIncompleteDialogOpen] = useState(false);
  const [incompleteReason, setIncompleteReason] = useState('');

  const statusMutation = useMutation({
    mutationFn: ({ status, reason }: { status: VisaStatus; reason?: string }) =>
      visaCasesService.updateStatus(id!, { status, reason }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-case', id] });
      queryClient.invalidateQueries({ queryKey: ['visa-cases'] });
      toast.success(t('visaCases:statusUpdated'));
      setSelectedStatus('');
      setIncompleteDialogOpen(false);
      setIncompleteReason('');
    },
    onError: () => toast.error(t('visaCases:updateFailed')),
  });

  const handleStatusSelect = (value: string) => {
    const status = value as VisaStatus;
    if (status === 'DOSSIER_INCOMPLET') {
      setIncompleteDialogOpen(true);
      return;
    }
    statusMutation.mutate({ status });
  };

  const handleNextStatus = () => {
    if (!visaCase) return;
    const next = NEXT_WORKFLOW_STATUS[visaCase.currentStatus];
    if (!next) return;
    if (next === 'DOSSIER_INCOMPLET') {
      setIncompleteDialogOpen(true);
      return;
    }
    statusMutation.mutate({ status: next });
  };

  const [sending, setSending] = useState<'whatsapp' | 'email' | null>(null);

  const handleSendWhatsApp = async () => {
    if (!visaCase?.client) return;
    setSending('whatsapp');
    try {
      const res = await templatesService.whatsappLink({ visaCaseId: visaCase.id, channel: 'WHATSAPP' });
      window.open(res.url, '_blank', 'noopener');
      toast.success(t('common:success'));
    } catch (error) {
      // The API explains what is missing (no email, no template...); showing
      // a generic word instead would hide the one thing the agent needs.
      toast.error((error as ApiError)?.message || t('common:error'));
    } finally {
      setSending(null);
    }
  };

  const handleSendEmail = async () => {
    if (!visaCase?.client) return;
    const client = visaCase.client as { id: string; fullName: string; phoneNumber: string; email?: string | null; passportNumber?: string | null; passportExpiry?: string | null };
    const email = client.email;
    if (!email) {
      toast.error(t('templates:clientNoEmail'));
      return;
    }
    setSending('email');
    try {
      await templatesService.sendEmail({ visaCaseId: visaCase.id, channel: 'EMAIL', to: email });
      toast.success(t('common:success'));
    } catch (error) {
      // The API explains what is missing (no email, no template...); showing
      // a generic word instead would hide the one thing the agent needs.
      toast.error((error as ApiError)?.message || t('common:error'));
    } finally {
      setSending(null);
    }
  };

  const priceMutation = useMutation({
    mutationFn: (data: { price?: number; isPaid?: boolean }) => visaCasesService.update(id!, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['visa-case', id] });
      toast.success(t('visaCases:caseUpdated'));
    },
    onError: () => toast.error(t('visaCases:updateFailed')),
  });

  if (isLoading) {
    return <DetailSkeleton />;
  }

  if (!visaCase) {
    return <div className="py-16 text-center text-muted-foreground">{t('visaCases:caseNotFound')}</div>;
  }

  const showPriceField = visaCase.currentStatus === 'RDV_OK' || (visaCase.price != null && visaCase.price > 0);
  const showPaidToggle = visaCase.currentStatus === 'LIVREE';

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
          <Button data-testid="bordereau-print" variant="default" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-1" />
            {t('common:print')}
          </Button>
        </div>
      </div>

      {canDecide && (
      <div className="flex items-center gap-4 rounded-lg border p-4">
        <div className="flex-1">
          <p className="text-sm text-muted-foreground">{t('common:status')}</p>
        </div>
        <Select value={selectedStatus} onValueChange={handleStatusSelect}>
          <SelectTrigger className="w-[200px]" data-testid="status-select">
            <SelectValue placeholder={t('visaCases:selectStatus')} />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((s) => (
              <SelectItem key={s} value={s} data-testid={`status-option-${s}`}>{t('status:' + s)}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      {NEXT_WORKFLOW_STATUS[visaCase.currentStatus] && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleNextStatus}
            disabled={statusMutation.isPending}
          >
            {t('kanban:next')}
            <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        )}
      </div>
      )}

      {/* Documents sit beside the completeness call: the desk decides after
          looking at what has actually been supplied. */}
      <div className="grid gap-6 md:grid-cols-2">
        <div className="space-y-6">
          <CaseFilesPanel visaCaseId={id!} />
          <RequiredDocumentsChecklist
            visaCaseId={id!}
            country={visaCase.visaCountry}
            visaType={visaCase.visaType}
          />
        </div>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">{t('visaCases:dossierState')}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {visaCase.currentStatus === 'DOSSIER_INCOMPLET' ? (
              <>
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 p-3 dark:border-amber-500/25 dark:bg-amber-500/10">
                  <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600 dark:text-amber-400" />
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-amber-800 dark:text-amber-300">
                      {t('status:DOSSIER_INCOMPLET')}
                    </p>
                    {visaCase.incompleteReason && (
                      <p className="mt-0.5 whitespace-pre-wrap text-sm text-amber-700 dark:text-amber-300/90">
                        {visaCase.incompleteReason}
                      </p>
                    )}
                  </div>
                </div>
                <div className={canDecide ? 'flex flex-wrap gap-2' : 'hidden'}>
                  <Button
                    size="sm"
                    onClick={() => statusMutation.mutate({ status: 'EN_ATTENTE' })}
                    disabled={statusMutation.isPending}
                    data-testid="mark-complete"
                  >
                    <CheckCircle2 className="mr-1 h-4 w-4" />
                    {t('visaCases:markComplete')}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => { setIncompleteReason(visaCase.incompleteReason ?? ''); setIncompleteDialogOpen(true); }}
                    disabled={statusMutation.isPending}
                  >
                    {t('common:edit')}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">{t('visaCases:completeHint')}</p>
              </>
            ) : (
              <>
                <p className="text-sm text-muted-foreground">{t('visaCases:completeHint')}</p>
                {canDecide && (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => { setIncompleteReason(''); setIncompleteDialogOpen(true); }}
                  disabled={statusMutation.isPending}
                  data-testid="mark-incomplete"
                >
                  <AlertTriangle className="mr-1 h-4 w-4 text-amber-500" />
                  {t('visaCases:markIncomplete')}
                </Button>
                )}
              </>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader><CardTitle>{t('visaCases:dossierState')}</CardTitle></CardHeader>
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
            {visaCase.currentStatus === 'DOSSIER_INCOMPLET' && visaCase.incompleteReason && (
              <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 dark:bg-amber-950/40">
                <p className="text-xs font-medium text-amber-800 dark:text-amber-300">{t('visaCases:incompleteReason')}</p>
                <p className="text-sm text-amber-700 dark:text-amber-200">{visaCase.incompleteReason}</p>
              </div>
            )}
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

      {(showPriceField || showPaidToggle) && (
        <Card>
          <CardHeader><CardTitle>{t('visaCases:price')}</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {showPriceField && (
              <div className="flex items-center gap-4">
                <div className="space-y-2 flex-1 max-w-xs">
                  <Label htmlFor="price">{t('visaCases:price')}</Label>
                  <Input
                    id="price"
                    type="number"
                    min={0}
                    value={price || (visaCase.price?.toString() ?? '')}
                    onChange={(e) => setPrice(e.target.value)}
                    placeholder="0"
                  />
                </div>
                <Button
                  size="sm"
                  onClick={() => {
                    const priceNum = price ? parseFloat(price) : undefined;
                    priceMutation.mutate({ price: priceNum });
                  }}
                  disabled={priceMutation.isPending}
                >
                  {t('common:save')}
                </Button>
              </div>
            )}
            {showPaidToggle && (
              <div className="flex items-center gap-4">
                <div className="space-y-2">
                  <Label>{t('visaCases:isPaid')}</Label>
                  <div className="flex gap-2">
                    <Button
                      variant={visaCase.isPaid ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => priceMutation.mutate({ isPaid: true })}
                      disabled={priceMutation.isPending}
                    >
                      {t('visaCases:isPaid')}
                    </Button>
                    <Button
                      variant={!visaCase.isPaid ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => priceMutation.mutate({ isPaid: false })}
                      disabled={priceMutation.isPending}
                    >
                      {t('visaCases:notPaid')}
                    </Button>
                  </div>
                </div>
                {visaCase.price != null && (
                  <div className="text-sm">
                    <span className="text-muted-foreground">{t('visaCases:price')}: </span>
                    <span className="font-medium">{visaCase.price}</span>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {visaCase.currentStatus === 'RDV_OK' && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4" />
              <CardTitle>{t('kanban:sendNotification')}</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {(visaCase.client?.passportNumber || visaCase.client?.passportExpiry) && (
                <div className="flex items-center gap-2 text-sm">
                  <IdCard className="h-4 w-4 shrink-0 text-muted-foreground" />
                  <span className="font-mono font-medium">
                    {visaCase.client?.passportNumber ?? '-'}
                  </span>
                  {visaCase.client?.passportExpiry && (
                    <>
                      <span className="text-muted-foreground">—</span>
                      <span className="text-xs text-muted-foreground">
                        {t('kanban:passport')}:{' '}
                        {new Date(visaCase.client.passportExpiry).toLocaleDateString(
                          i18n.language?.replace('_', '-') ?? 'en-US',
                          { day: '2-digit', month: 'short', year: 'numeric' },
                        )}
                      </span>
                    </>
                  )}
                </div>
              )}
              <AppointmentPicker
                visaCaseId={visaCase.id}
                appointment={visaCase.appointments?.[0]}
                variant="full"
              />
              <div className="flex gap-2">
                <Button variant="outline" onClick={handleSendWhatsApp} disabled={sending !== null}>
                  {sending === 'whatsapp' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <MessageCircle className="h-4 w-4 mr-1" />}
                  WhatsApp
                </Button>
                <Button variant="outline" onClick={handleSendEmail} disabled={sending !== null}>
                  {sending === 'email' ? <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : <Mail className="h-4 w-4 mr-1" />}
                  Email
                </Button>
              </div>
            </div>
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

      {/* Incomplete dossier reason dialog */}
      <Dialog open={incompleteDialogOpen} onOpenChange={(open) => { if (!open) { setIncompleteDialogOpen(false); setIncompleteReason(''); } }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('kanban:incompleteTitle')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 py-2">
            <Label htmlFor="detail-incomplete-reason">{t('kanban:incompleteReasonLabel')}</Label>
            <textarea
              id="detail-incomplete-reason"
              className="flex min-h-[90px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
              placeholder={t('kanban:incompleteReasonPlaceholder')}
              value={incompleteReason}
              onChange={(e) => setIncompleteReason(e.target.value)}
              maxLength={500}
              autoFocus
            />
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => { setIncompleteDialogOpen(false); setIncompleteReason(''); }}>
              {t('common:cancel')}
            </Button>
            <Button
              disabled={!incompleteReason.trim() || statusMutation.isPending}
              onClick={() => statusMutation.mutate({ status: 'DOSSIER_INCOMPLET', reason: incompleteReason.trim() })}
            >
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <LabelDialog
        open={showLabelDialog}
        onOpenChange={setShowLabelDialog}
        data={
          visaCase?.client
            ? ({
                fullName: visaCase.client.fullName,
                phoneNumber: visaCase.client.phoneNumber,
                passportNumber: visaCase.client.passportNumber,
                passportExpiry: visaCase.client.passportExpiry,
                visaCountry: visaCase.visaCountry,
                visaType: visaCase.visaType,
              } satisfies LabelData)
            : null
        }
      />
    </div>
  );
}