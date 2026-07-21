import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { templatesService, refDataService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ConfirmDeleteDialog } from '@/components/shared/confirm-delete-dialog';
import { Plus, Pencil, Trash2, MessageCircle, Mail, Loader2, FileText } from 'lucide-react';
import type { MessageTemplate, TemplateChannel, CreateTemplateRequest, AppointmentType, ApiError } from '@/types';
import { TEMPLATE_VARIABLES } from '@/types';
import { EmptyState } from '@/components/shared/empty-state';

const NONE = '__none__';

interface TemplateFormState {
  name: string;
  channel: TemplateChannel;
  country: string;
  visaType: string;
  appointmentType: string;
  subject: string;
  body: string;
}

const emptyForm: TemplateFormState = {
  name: '',
  channel: 'WHATSAPP',
  country: '',
  visaType: '',
  appointmentType: '',
  subject: '',
  body: '',
};

export function TemplatesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState<TemplateFormState>(emptyForm);
  const [deleteTarget, setDeleteTarget] = useState<MessageTemplate | null>(null);
  const bodyRef = useRef<HTMLTextAreaElement>(null);

  const { data: templates = [], isLoading } = useQuery({
    queryKey: ['templates'],
    queryFn: () => templatesService.findAll(),
  });

  const { data: countries = [] } = useQuery({
    queryKey: ['ref-data', 'countries'],
    queryFn: () => refDataService.getCountries(),
  });

  const { data: visaTypes = [] } = useQuery({
    queryKey: ['ref-data', 'visa-types'],
    queryFn: () => refDataService.getVisaTypes(),
  });

  const saveMutation = useMutation({
    mutationFn: (data: CreateTemplateRequest) =>
      editingId ? templatesService.update(editingId, data) : templatesService.create(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success(t(editingId ? 'templates:updated' : 'templates:created'));
      closeDialog();
    },
    onError: (error) => toast.error((error as unknown as ApiError)?.message || t('templates:saveError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => templatesService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['templates'] });
      toast.success(t('templates:deleted'));
      setDeleteTarget(null);
    },
    onError: () => toast.error(t('templates:deleteError')),
  });

  const closeDialog = () => {
    setDialogOpen(false);
    setEditingId(null);
    setForm(emptyForm);
  };

  const openCreate = () => {
    setEditingId(null);
    setForm(emptyForm);
    setDialogOpen(true);
  };

  const openEdit = (tpl: MessageTemplate) => {
    setEditingId(tpl.id);
    setForm({
      name: tpl.name,
      channel: tpl.channel,
      country: tpl.country ?? '',
      visaType: tpl.visaType ?? '',
      appointmentType: tpl.appointmentType ?? '',
      subject: tpl.subject ?? '',
      body: tpl.body,
    });
    setDialogOpen(true);
  };

  const insertVariable = (variable: string) => {
    const textarea = bodyRef.current;
    const token = `{{${variable}}}`;
    if (!textarea) {
      setForm((f) => ({ ...f, body: f.body + token }));
      return;
    }
    const start = textarea.selectionStart ?? form.body.length;
    const end = textarea.selectionEnd ?? form.body.length;
    const next = form.body.slice(0, start) + token + form.body.slice(end);
    setForm((f) => ({ ...f, body: next }));
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(start + token.length, start + token.length);
    });
  };

  const handleSave = () => {
    if (!form.name.trim() || !form.body.trim()) {
      toast.error(t('common:fillRequiredFields'));
      return;
    }
    saveMutation.mutate({
      name: form.name.trim(),
      channel: form.channel,
      country: form.country || undefined,
      visaType: form.visaType || undefined,
      appointmentType: form.appointmentType || undefined,
      subject: form.channel === 'EMAIL' ? form.subject || undefined : undefined,
      body: form.body,
    });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('templates:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('templates:subtitle')}</p>
        </div>
        <Button onClick={openCreate} data-testid="new-template-button">
          <Plus className="h-4 w-4 mr-2" />
          {t('templates:newTemplate')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : templates.length === 0 ? (
        <EmptyState
          icon={FileText}
          title={t('templates:empty')}
          description={t('templates:emptyDesc')}
          actionLabel={t('templates:newTemplate')}
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {templates.map((tpl) => (
            <Card key={tpl.id} className="flex flex-col">
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="text-base flex items-center gap-2">
                    {tpl.channel === 'WHATSAPP' ? (
                      <MessageCircle className="h-4 w-4 text-green-600" />
                    ) : (
                      <Mail className="h-4 w-4 text-blue-600" />
                    )}
                    {tpl.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t('common:edit')} onClick={() => openEdit(tpl)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-destructive" aria-label={t('common:delete')} onClick={() => setDeleteTarget(tpl)}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge className="bg-gray-100 text-gray-700 text-[10px]">{tpl.channel}</Badge>
                  {tpl.country && <Badge className="bg-blue-100 text-blue-700 text-[10px]">{tpl.country}</Badge>}
                  {tpl.visaType && <Badge className="bg-purple-100 text-purple-700 text-[10px]">{tpl.visaType}</Badge>}
                  {tpl.appointmentType && <Badge className="bg-orange-100 text-orange-700 text-[10px]">{t('appointmentType:' + tpl.appointmentType)}</Badge>}
                </div>
              </CardHeader>
              <CardContent className="flex-1">
                <p className="line-clamp-4 whitespace-pre-wrap text-xs text-muted-foreground">{tpl.body}</p>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Create / Edit dialog */}
      <Dialog open={dialogOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingId ? t('templates:editTemplate') : t('templates:newTemplate')}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="space-y-2">
                <Label>{t('templates:name')} <span className="text-destructive">*</span></Label>
                <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="template-name" />
              </div>
              <div className="space-y-2">
                <Label>{t('templates:channel')}</Label>
                <Select value={form.channel} onValueChange={(v: TemplateChannel) => setForm({ ...form, channel: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="WHATSAPP">WhatsApp</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-3">
              <div className="space-y-2">
                <Label>{t('templates:country')}</Label>
                <Select value={form.country || NONE} onValueChange={(v) => setForm({ ...form, country: v === NONE ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('common:all')}</SelectItem>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('templates:visaType')}</Label>
                <Select value={form.visaType || NONE} onValueChange={(v) => setForm({ ...form, visaType: v === NONE ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('common:all')}</SelectItem>
                    {visaTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>{t('templates:appointmentType')}</Label>
                <Select value={form.appointmentType || NONE} onValueChange={(v) => setForm({ ...form, appointmentType: v === NONE ? '' : v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={NONE}>{t('common:all')}</SelectItem>
                    {(['TLS', 'VFS', 'EMBASSY', 'BIOMETRICS', 'INTERVIEW', 'OTHER'] as AppointmentType[]).map((k) => (
                      <SelectItem key={k} value={k}>{t(`appointmentType:${k}`)}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            {form.channel === 'EMAIL' && (
              <div className="space-y-2">
                <Label>{t('templates:subject')}</Label>
                <Input value={form.subject} onChange={(e) => setForm({ ...form, subject: e.target.value })} />
              </div>
            )}

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>{t('templates:body')} <span className="text-destructive">*</span></Label>
              </div>
              <div className="flex flex-wrap gap-1">
                {TEMPLATE_VARIABLES.map((v) => (
                  <Button
                    key={v}
                    type="button"
                    variant="outline"
                    size="sm"
                    className="h-6 px-1.5 text-[10px] font-mono"
                    onClick={() => insertVariable(v)}
                  >
                    {`{{${v}}}`}
                  </Button>
                ))}
              </div>
              <textarea
                ref={bodyRef}
                className="flex min-h-[160px] w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-sm"
                value={form.body}
                onChange={(e) => setForm({ ...form, body: e.target.value })}
                data-testid="template-body"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>{t('common:cancel')}</Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending} data-testid="template-save">
              {saveMutation.isPending ? t('common:saving') : t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <ConfirmDeleteDialog
        open={!!deleteTarget}
        onOpenChange={(open) => !open && setDeleteTarget(null)}
        onConfirm={() => deleteTarget && deleteMutation.mutate(deleteTarget.id)}
        isLoading={deleteMutation.isPending}
        title={t('templates:deleteTitle')}
        description={t('templates:deleteWarning', { name: deleteTarget?.name ?? '' })}
      />
    </div>
  );
}
