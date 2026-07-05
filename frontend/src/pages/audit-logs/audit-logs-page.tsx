import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, History } from 'lucide-react';
import { api } from '@/services/api';
import { AuditLog } from '@/types/audit-log';
import { Badge } from '@/components/shared/badge';

export function AuditLogsPage() {
  const { t, i18n } = useTranslation();
  const [search, setSearch] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('');

  const { data: result, isLoading } = useQuery({
    queryKey: ['audit-logs'],
    queryFn: () => api.get<{ data: AuditLog[]; total: number }>('/audit-logs', { limit: '100' }),
  });

  const logs = result?.data || [];

  const filtered = logs.filter((log) => {
    const searchString = search.toLowerCase();
    if (searchString && !log.entity.toLowerCase().includes(searchString) && !(log.user?.firstName?.toLowerCase().includes(searchString))) return false;
    if (actionFilter && log.action !== actionFilter) return false;
    return true;
  });

  const handleDownload = () => {
    const content = filtered.map((log) =>
      `[${new Date(log.createdAt).toLocaleString()}] [${log.action}] [${log.entity}] User: ${log.user?.firstName} ${log.user?.lastName}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `audit-logs-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('auditLogs:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('auditLogs:subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          {t('auditLogs:export')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('auditLogs:searchPlaceholder')}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {['', 'CREATE', 'UPDATE', 'DELETE', 'STATUS_CHANGE', 'LOGIN'].map((action) => (
            <button
              key={action}
              onClick={() => setActionFilter(action)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                actionFilter === action ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {action || t('auditLogs:all')}
            </button>
          ))}
        </div>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="max-h-[60vh] overflow-y-auto">
          {isLoading ? (
            <div className="space-y-1 p-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="flex items-center gap-3">
                  <div className="skeleton-shimmer h-3.5 w-3.5 rounded-full" />
                  <div className="skeleton-shimmer h-3 w-24 rounded" />
                  <div className="skeleton-shimmer h-3 w-16 rounded" />
                  <div className="skeleton-shimmer h-3 flex-1 rounded" />
                </div>
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">{t('auditLogs:noLogsFound')}</div>
          ) : (
            <div className="divide-y text-sm">
              {filtered.map((log) => (
                <div key={log.id} className="flex items-center gap-4 px-4 py-3 hover:bg-muted/30">
                  <div className="shrink-0 mt-0.5">
                    <History className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="w-32 shrink-0 text-muted-foreground text-xs">
                    {new Date(log.createdAt).toLocaleString(i18n.language?.replace('_', '-') ?? 'en-US')}
                  </div>
                  <div className="w-24 shrink-0">
                    <Badge className={log.action === 'DELETE' ? 'bg-destructive/10 text-destructive text-[10px]' : 'bg-secondary text-secondary-foreground text-[10px]'}>
                      {log.action}
                    </Badge>
                  </div>
                  <div className="w-32 shrink-0 font-medium text-xs">
                    {log.entity}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="truncate text-xs">
                      {t('auditLogs:user')}: {log.user?.firstName} {log.user?.lastName}
                    </p>
                    {log.metadata && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {JSON.stringify(log.metadata)}
                      </p>
                    )}
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
