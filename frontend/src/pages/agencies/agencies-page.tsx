import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Plus, Pencil, Trash2, Building2, KeyRound, Loader2, Users, FolderOpen } from 'lucide-react';
import { agenciesService } from '@/services';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/shared/badge';
import { EmptyState } from '@/components/shared/empty-state';
import {
  Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import type { Agency, ApiError } from '@/types';

const emptyForm = { name: '', contactName: '', contactPhone: '', contactEmail: '' };
const emptyLogin = { email: '', password: '', firstName: '', lastName: '' };

export function AgenciesPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [loginFor, setLoginFor] = useState<Agency | null>(null);
  const [login, setLogin] = useState(emptyLogin);

  const { data: agencies = [], isLoading } = useQuery({
    queryKey: ['agencies'],
    queryFn: () => agenciesService.findAll(),
  });

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['agencies'] });

  const saveMutation = useMutation({
    mutationFn: () =>
      editingId
        ? agenciesService.update(editingId, form)
        : agenciesService.create(form),
    onSuccess: () => {
      invalidate();
      toast.success(t('common:success'));
      setDialogOpen(false);
      setForm(emptyForm);
      setEditingId(null);
    },
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const toggleActive = useMutation({
    mutationFn: (agency: Agency) =>
      agenciesService.update(agency.id, { isActive: !agency.isActive }),
    onSuccess: () => { invalidate(); toast.success(t('common:success')); },
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const removeMutation = useMutation({
    mutationFn: (id: string) => agenciesService.remove(id),
    onSuccess: () => { invalidate(); toast.success(t('common:success')); },
    // The API refuses to delete an agency that has cases and says why.
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const loginMutation = useMutation({
    mutationFn: () => agenciesService.createUser(loginFor!.id, login),
    onSuccess: () => {
      invalidate();
      toast.success(t('agencies:loginCreated'));
      setLoginFor(null);
      setLogin(emptyLogin);
    },
    onError: (e) => toast.error((e as unknown as ApiError)?.message || t('common:error')),
  });

  const openCreate = () => { setEditingId(null); setForm(emptyForm); setDialogOpen(true); };
  const openEdit = (a: Agency) => {
    setEditingId(a.id);
    setForm({
      name: a.name,
      contactName: a.contactName ?? '',
      contactPhone: a.contactPhone ?? '',
      contactEmail: a.contactEmail ?? '',
    });
    setDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {t('agencies:title')}
          </h1>
          <p className="text-sm text-muted-foreground">{t('agencies:subtitle')}</p>
        </div>
        <Button onClick={openCreate} data-testid="new-agency-button">
          <Plus className="mr-2 h-4 w-4" />
          {t('agencies:newAgency')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : agencies.length === 0 ? (
        <EmptyState
          icon={Building2}
          title={t('agencies:empty')}
          description={t('agencies:emptyDesc')}
          actionLabel={t('agencies:newAgency')}
          onAction={openCreate}
        />
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {agencies.map((a) => (
            <Card key={a.id} data-testid={`agency-${a.id}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between gap-2">
                  <CardTitle className="flex items-center gap-2 text-base">
                    <Building2 className="h-4 w-4 text-primary" />
                    {a.name}
                  </CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" className="h-7 w-7" aria-label={t('common:edit')} onClick={() => openEdit(a)}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      aria-label={t('common:delete')}
                      onClick={() => { if (confirm(t('agencies:confirmDelete'))) removeMutation.mutate(a.id); }}
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1 pt-1">
                  <Badge className={a.isActive ? 'bg-emerald-100 text-emerald-700 text-[10px]' : 'bg-gray-200 text-gray-700 text-[10px]'}>
                    {a.isActive ? t('agencies:active') : t('agencies:inactive')}
                  </Badge>
                  <Badge className="bg-blue-100 text-blue-700 text-[10px]">
                    <Users className="mr-1 inline h-3 w-3" />
                    {a._count?.users ?? 0}
                  </Badge>
                  <Badge className="bg-purple-100 text-purple-700 text-[10px]">
                    <FolderOpen className="mr-1 inline h-3 w-3" />
                    {a._count?.visaCases ?? 0}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent className="space-y-2 text-sm">
                {a.contactName && <p className="text-muted-foreground">{a.contactName}</p>}
                {a.contactPhone && <p className="font-mono text-xs" dir="ltr">{a.contactPhone}</p>}
                {a.contactEmail && <p className="truncate text-xs text-muted-foreground">{a.contactEmail}</p>}
                <div className="flex gap-2 pt-1">
                  <Button variant="outline" size="sm" className="flex-1" onClick={() => { setLoginFor(a); setLogin(emptyLogin); }}>
                    <KeyRound className="mr-1 h-3.5 w-3.5" />
                    {t('agencies:addLogin')}
                  </Button>
                  <Button variant="outline" size="sm" onClick={() => toggleActive.mutate(a)}>
                    {a.isActive ? t('agencies:deactivate') : t('agencies:activate')}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={(o) => { if (!o) setDialogOpen(false); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingId ? t('agencies:editAgency') : t('agencies:newAgency')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1.5">
              <Label>{t('agencies:name')} <span className="text-destructive">*</span></Label>
              <Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} data-testid="agency-name" />
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('agencies:contactName')}</Label>
                <Input value={form.contactName} onChange={(e) => setForm({ ...form, contactName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('clients:phone')}</Label>
                <Input value={form.contactPhone} onChange={(e) => setForm({ ...form, contactPhone: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('clients:email')}</Label>
              <Input type="email" value={form.contactEmail} onChange={(e) => setForm({ ...form, contactEmail: e.target.value })} />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>{t('common:cancel')}</Button>
            <Button
              onClick={() => { if (!form.name.trim()) { toast.error(t('common:fillRequiredFields')); return; } saveMutation.mutate(); }}
              disabled={saveMutation.isPending}
              data-testid="agency-save"
            >
              {t('common:save')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Dialog open={!!loginFor} onOpenChange={(o) => { if (!o) setLoginFor(null); }}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('agencies:addLoginFor', { name: loginFor?.name ?? '' })}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            <p className="text-sm text-muted-foreground">{t('agencies:loginHint')}</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <div className="space-y-1.5">
                <Label>{t('clients:fullName')} <span className="text-destructive">*</span></Label>
                <Input value={login.firstName} onChange={(e) => setLogin({ ...login, firstName: e.target.value })} />
              </div>
              <div className="space-y-1.5">
                <Label>{t('agencies:lastName')} <span className="text-destructive">*</span></Label>
                <Input value={login.lastName} onChange={(e) => setLogin({ ...login, lastName: e.target.value })} />
              </div>
            </div>
            <div className="space-y-1.5">
              <Label>{t('clients:email')} <span className="text-destructive">*</span></Label>
              <Input type="email" value={login.email} onChange={(e) => setLogin({ ...login, email: e.target.value })} data-testid="agency-login-email" />
            </div>
            <div className="space-y-1.5">
              <Label>{t('auth:password')} <span className="text-destructive">*</span></Label>
              <Input type="text" value={login.password} onChange={(e) => setLogin({ ...login, password: e.target.value })} data-testid="agency-login-password" />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setLoginFor(null)}>{t('common:cancel')}</Button>
            <Button
              onClick={() => {
                if (!login.email.trim() || login.password.length < 8 || !login.firstName.trim() || !login.lastName.trim()) {
                  toast.error(t('agencies:loginValidation'));
                  return;
                }
                loginMutation.mutate();
              }}
              disabled={loginMutation.isPending}
              data-testid="agency-login-save"
            >
              {t('common:create')}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
