import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Trash2, ListChecks, Loader2, Pencil } from 'lucide-react';
import { requiredDocumentsService, refDataService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import type { RequiredDocument, ApiError } from '@/types';

const ALL = '__all__';
const emptyForm = { label: '', country: ALL, visaType: ALL, sortOrder: 0 };

/**
 * The checklist an application must satisfy. Leaving country or visa type on
 * "all" makes an item apply everywhere, the same rule message templates use.
 */
export function RequiredDocumentsPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);

  const { data: items = [], isLoading } = useQuery({
    queryKey: ['required-documents'],
    queryFn: () => requiredDocumentsService.findAll(),
  });
  const { data: countries = [] } = useQuery({
    queryKey: ['ref-data', 'countries'],
    queryFn: () => refDataService.getCountries(),
  });
  const { data: visaTypes = [] } = useQuery({
    queryKey: ['ref-data', 'visa-types'],
    queryFn: () => refDataService.getVisaTypes(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['required-documents'] });

  const saveMutation = useMutation({
    mutationFn: () => {
      const payload = {
        label: form.label.trim(),
        country: form.country === ALL ? undefined : form.country,
        visaType: form.visaType === ALL ? undefined : form.visaType,
        sortOrder: Number(form.sortOrder) || 0,
      };
      return editingId
        ? requiredDocumentsService.update(editingId, payload)
        : requiredDocumentsService.create(payload);
    },
    onSuccess: () => {
      invalidate();
      toast.success(t('common:success'));
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => requiredDocumentsService.remove(id),
    onSuccess: () => { invalidate(); toast.success(t('common:success')); },
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const toggleActive = useMutation({
    mutationFn: (doc: RequiredDocument) =>
      requiredDocumentsService.update(doc.id, { isActive: !doc.isActive }),
    onSuccess: () => invalidate(),
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (d: RequiredDocument) => {
    setEditingId(d.id);
    setForm({
      label: d.label,
      country: d.country ?? ALL,
      visaType: d.visaType ?? ALL,
      sortOrder: d.sortOrder,
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {t('requiredDocs:title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('requiredDocs:subtitle')}</p>
        </div>
        <Button onClick={openCreate} data-testid="new-required-doc-button">
          <Plus className="mr-2 h-4 w-4" />
          {t('requiredDocs:newItem')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : items.length === 0 ? (
        <EmptyState
          icon={ListChecks}
          title={t('requiredDocs:empty')}
          description={t('requiredDocs:emptyDesc')}
          actionLabel={t('requiredDocs:newItem')}
          onAction={openCreate}
        />
      ) : (
        <Card>
          <CardContent className="divide-y p-0">
            {items.map((d) => (
              <div key={d.id} className="flex items-center gap-3 px-4 py-3" data-testid={`required-doc-${d.id}`}>
                <ListChecks className={d.isActive ? 'h-4 w-4 shrink-0 text-primary' : 'h-4 w-4 shrink-0 text-muted-foreground'} />
                <div className="min-w-0 flex-1">
                  <p className={d.isActive ? 'text-sm font-medium' : 'text-sm font-medium text-muted-foreground line-through'}>
                    {d.label}
                  </p>
                  <div className="mt-1 flex flex-wrap gap-1">
                    <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                      {d.country ?? t('requiredDocs:allCountries')}
                    </Badge>
                    <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                      {d.visaType ?? t('requiredDocs:allTypes')}
                    </Badge>
                  </div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => toggleActive.mutate(d)}>
                  {d.isActive ? t('agencies:deactivate') : t('agencies:activate')}
                </Button>
                <Button variant="ghost" size="icon" className="h-8 w-8" aria-label={t('common:edit')} onClick={() => openEdit(d)}>
                  <Pencil className="h-3.5 w-3.5" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-destructive"
                  aria-label={t('common:delete')}
                  onClick={() => { if (confirm(t('requiredDocs:confirmDelete'))) removeMutation.mutate(d.id); }}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </Button>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('requiredDocs:editItem') : t('requiredDocs:newItem')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('requiredDocs:label')} <span className="text-destructive">*</span></Label>
              <Input
                value={form.label}
                onChange={(e) => setForm({ ...form, label: e.target.value })}
                placeholder={t('requiredDocs:labelPlaceholder')}
                data-testid="required-doc-label"
              />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('visaCases:country')}</Label>
                <Select value={form.country} onValueChange={(v) => setForm({ ...form, country: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('requiredDocs:allCountries')}</SelectItem>
                    {countries.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label>{t('visaCases:visaType')}</Label>
                <Select value={form.visaType} onValueChange={(v) => setForm({ ...form, visaType: v })}>
                  <SelectTrigger><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value={ALL}>{t('requiredDocs:allTypes')}</SelectItem>
                    {visaTypes.map((v) => <SelectItem key={v} value={v}>{v}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('requiredDocs:sortOrder')}</Label>
              <Input
                type="number"
                value={form.sortOrder}
                onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common:cancel')}</Button>
            <Button
              onClick={() => { if (!form.label.trim()) { toast.error(t('common:fillRequiredFields')); return; } saveMutation.mutate(); }}
              disabled={saveMutation.isPending}
              data-testid="required-doc-save"
            >
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
