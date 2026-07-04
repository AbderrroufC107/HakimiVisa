import { useState, type FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/shared/badge';
import { cn } from '@/lib/utils';
import {
  UserPlus,
  Trash2,
  Loader2,
  Users,
  Mail,
  Calendar,
  Shield,
} from 'lucide-react';
import { authService } from '@/services';
import type { AuthUser } from '@/types';

export function ManagersPage() {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [form, setForm] = useState({ firstName: '', lastName: '', email: '', password: '' });

  const { data: managers = [], isLoading } = useQuery({
    queryKey: ['managers'],
    queryFn: () => authService.listManagers(),
  });

  const createMutation = useMutation({
    mutationFn: (data: typeof form) => authService.createManager(data),
    onSuccess: () => {
      toast.success(t('settings:managerCreated'));
      setForm({ firstName: '', lastName: '', email: '', password: '' });
      setCreateOpen(false);
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
    onError: () => toast.error(t('settings:managerCreateError')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => authService.deleteManager(id),
    onSuccess: () => {
      toast.success('Manager deleted');
      queryClient.invalidateQueries({ queryKey: ['managers'] });
    },
    onError: () => toast.error('Failed to delete manager'),
  });

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    createMutation.mutate(form);
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">
            {t('nav:users') || 'Managers'}
          </h1>
          <p className="text-sm text-muted-foreground">Manage admin managers</p>
        </div>
        <Button onClick={() => setCreateOpen(true)} data-testid="create-manager-btn">
          <UserPlus className="mr-2 h-4 w-4" />
          {t('settings:createManager')}
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : managers.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <Users className="mx-auto h-12 w-12 text-muted-foreground/40" />
            <p className="mt-4 text-muted-foreground">No managers found</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {managers.map((m: AuthUser) => (
            <Card key={m.id} className="transition-shadow hover:shadow-md">
              <CardContent className="flex items-center justify-between p-4">
                <div className="flex items-center gap-4">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary font-semibold">
                    {m.firstName?.[0]}{m.lastName?.[0]}
                  </div>
                  <div>
                    <p className="font-medium">{m.firstName} {m.lastName}</p>
                    <div className="flex items-center gap-3 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1">
                        <Mail className="h-3 w-3" />{m.email}
                      </span>
                      <span className="flex items-center gap-1">
                        <Calendar className="h-3 w-3" />
                        {m.createdAt ? new Date(m.createdAt).toLocaleDateString() : '—'}
                      </span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={cn('border', m.isActive ? 'bg-green-50 text-green-700 border-green-200' : 'bg-gray-50 text-gray-700 border-gray-200')}>
                    <Shield className="mr-1 h-3 w-3" />
                    {m.role}
                  </Badge>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={() => {
                      if (confirm('Delete this manager?')) {
                        deleteMutation.mutate(m.id);
                      }
                    }}
                    data-testid={`delete-manager-${m.id}`}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{t('settings:createManager')}</DialogTitle>
          </DialogHeader>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>{t('auth:firstName')}</Label>
                <Input
                  value={form.firstName}
                  onChange={(e) => setForm({ ...form, firstName: e.target.value })}
                  required
                />
              </div>
              <div>
                <Label>{t('auth:lastName')}</Label>
                <Input
                  value={form.lastName}
                  onChange={(e) => setForm({ ...form, lastName: e.target.value })}
                  required
                />
              </div>
            </div>
            <div>
              <Label>{t('auth:email')}</Label>
              <Input
                type="email"
                value={form.email}
                onChange={(e) => setForm({ ...form, email: e.target.value })}
                required
              />
            </div>
            <div>
              <Label>{t('auth:password')}</Label>
              <Input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                required
                minLength={8}
              />
            </div>
            <DialogFooter>
              <Button type="submit" disabled={createMutation.isPending}>
                {createMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {t('common:create')}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
