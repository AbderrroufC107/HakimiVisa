import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, Download, AlertTriangle, Info, XCircle } from 'lucide-react';
import { api } from '@/services/api';

interface LogEntry {
  timestamp: string;
  level: string;
  context: string;
  message: string;
  trace?: string;
}

export function SystemLogsPage() {
  const { t } = useTranslation();
  const [search, setSearch] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('');

  const { data: logs = [], isLoading } = useQuery({
    queryKey: ['system-logs'],
    queryFn: () => api.get<LogEntry[]>('/system-logs'),
  });

  const filtered = logs.filter((log) => {
    if (search && !log.message.toLowerCase().includes(search.toLowerCase()) && !log.context?.toLowerCase().includes(search.toLowerCase())) return false;
    if (levelFilter && log.level !== levelFilter) return false;
    return true;
  });

  const handleDownload = () => {
    const content = filtered.map((log) =>
      `[${log.timestamp}] [${log.level}] [${log.context}] ${log.message}${log.trace ? '\n' + log.trace : ''}`
    ).join('\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `system-logs-${new Date().toISOString().split('T')[0]}.log`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'ERROR': return <XCircle className="h-3.5 w-3.5 text-destructive" />;
      case 'WARN': return <AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />;
      default: return <Info className="h-3.5 w-3.5 text-blue-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('systemLogs:title')}</h1>
          <p className="text-sm text-muted-foreground">{t('systemLogs:subtitle')}</p>
        </div>
        <Button variant="outline" onClick={handleDownload}>
          <Download className="mr-2 h-4 w-4" />
          {t('systemLogs:downloadLogs')}
        </Button>
      </div>

      <div className="flex items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('systemLogs:searchPlaceholder')}
            className="pl-9 h-9"
          />
        </div>
        <div className="flex items-center gap-1 rounded-lg border p-1">
          {['', 'LOG', 'WARN', 'ERROR'].map((level) => (
            <button
              key={level}
              onClick={() => setLevelFilter(level)}
              className={`rounded px-2.5 py-1 text-xs font-medium transition-colors ${
                levelFilter === level ? 'bg-primary text-primary-foreground' : 'hover:bg-muted'
              }`}
            >
              {level || t('systemLogs:all')}
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
            <div className="flex items-center justify-center py-8 text-sm text-muted-foreground">{t('systemLogs:noLogs')}</div>
          ) : (
            <div className="divide-y font-mono text-xs">
              {filtered.map((log, idx) => (
                <div key={idx} className="flex items-start gap-3 px-4 py-2 hover:bg-muted/30">
                  <div className="mt-0.5 shrink-0">{getLevelIcon(log.level)}</div>
                  <span className="shrink-0 text-muted-foreground whitespace-nowrap">{log.timestamp}</span>
                  <span className="shrink-0 text-muted-foreground">[{log.context}]</span>
                  <div className={`flex-1 min-w-0 break-words ${log.level === 'ERROR' ? 'text-destructive' : log.level === 'WARN' ? 'text-yellow-600' : ''}`}>
                    {log.message}
                    {log.trace && <details className="text-muted-foreground mt-1"><summary className="cursor-pointer">{t('systemLogs:stack')}</summary><pre className="mt-1 whitespace-pre-wrap">{log.trace}</pre></details>}
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
