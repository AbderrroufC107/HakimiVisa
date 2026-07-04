import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import {
  Download, Trash2, Plus, Database, Clock,
  HardDrive, Settings,
} from 'lucide-react';
import { backupService } from '@/services/backup';
import { format, formatDistanceToNow } from 'date-fns';
import { enUS, fr } from 'date-fns/locale';
import { Badge } from '@/components/shared/badge';

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

export function BackupCenterPage() {
  const { t, i18n } = useTranslation();
  const locale = i18n.language?.startsWith('fr') ? fr : enUS;
  const queryClient = useQueryClient();

  const { data: backups = [], isLoading } = useQuery({
    queryKey: ['backups'],
    queryFn: () => backupService.findAll(),
    refetchInterval: 30_000,
  });

  const { data: settings } = useQuery({
    queryKey: ['backup-settings'],
    queryFn: () => backupService.getSettings(),
  });

  const createMutation = useMutation({
    mutationFn: () => backupService.create(),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success(t('backup:backupCreated'));
    },
    onError: () => toast.error(t('backup:backupFailed')),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => backupService.remove(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['backups'] });
      toast.success(t('backup:backupDeleted'));
    },
  });

  const handleDownload = async (id: string) => {
    try {
      const blob = await backupService.download(id);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `backup-${id}.zip`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch {
      toast.error(t('backup:downloadError'));
    }
  };

  const completed = backups.filter((b) => b.status === 'completed');
  const totalSize = completed.reduce((sum, b) => sum + b.size, 0);
  const lastBackup = completed.length > 0 ? completed[0] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('backup:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('backup:subtitle')}</p>
        </div>
        <Button data-testid="create-backup-button" onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          <Plus className="mr-2 h-4 w-4" />
          {createMutation.isPending ? t('backup:creating') : t('backup:createBackup')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            {t('backup:totalBackups')}
          </div>
          <p className="mt-1 text-2xl font-bold">{completed.length}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <HardDrive className="h-4 w-4" />
            {t('backup:totalSize')}
          </div>
          <p className="mt-1 text-2xl font-bold">{formatBytes(totalSize)}</p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t('backup:lastBackup')}
          </div>
          <p className="mt-1 text-2xl font-bold">
            {lastBackup ? formatDistanceToNow(new Date(lastBackup.createdAt), { addSuffix: true, locale }) : t('common:never')}
          </p>
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Settings className="h-4 w-4" />
            {t('backup:autoBackup')}
          </div>
          <p className="mt-1 text-2xl font-bold">{settings?.enabled ? t('common:on') : t('common:off')}</p>
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="border-b px-4 py-3">
          <h3 className="font-semibold">{t('backup:backupHistory')}</h3>
        </div>
        <div className="divide-y">
          {isLoading ? (
            <div className="space-y-2 p-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton-shimmer h-8 w-8 rounded-full" />
                  <div className="flex-1 space-y-1.5">
                    <div className="skeleton-shimmer h-4 w-48 rounded" />
                    <div className="skeleton-shimmer h-3 w-32 rounded" />
                  </div>
                  <div className="skeleton-shimmer h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          ) : backups.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">{t('backup:noBackups')}</div>
          ) : (
            backups.map((backup) => (
              <div key={backup.id} data-testid="backup-list-item" className="flex items-center justify-between px-4 py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div>
                    <p className="text-sm font-medium">{backup.filename}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span>{formatBytes(backup.size)}</span>
                      <span>·</span>
                      <span>{format(new Date(backup.createdAt), 'dd/MM/yyyy HH:mm')}</span>
                      <span>·</span>
                      <span>{backup.createdBy.firstName} {backup.createdBy.lastName}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Badge className={backup.status === 'completed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}>
                    {backup.status}
                  </Badge>
                  {backup.status === 'completed' && (
                    <>
                      <Button variant="ghost" size="icon" onClick={() => handleDownload(backup.id)}>
                        <Download className="h-4 w-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteMutation.mutate(backup.id)}>
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
