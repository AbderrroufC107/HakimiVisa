import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import {
  Activity, Database, Cpu, MemoryStick,
  Server, Globe, Clock, CheckCircle2, XCircle,
} from 'lucide-react';
import { api } from '@/services/api';

interface HealthData {
  database: { status: string };
  nodeVersion: string;
  environment: string;
  uptime: number;
  memory: { heapUsed: number; heapTotal: number; rss: number };
  platform: string;
  appVersion: string;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  return `${d}d ${h}h ${m}m`;
}

function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

export function SystemHealthPage() {
  const { t } = useTranslation();
  const { data: health, isLoading } = useQuery({
    queryKey: ['system-health'],
    queryFn: () => api.get<HealthData>('/health'),
    refetchInterval: 10_000,
  });

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div>
          <div className="skeleton-shimmer h-7 w-48 rounded mb-1" />
          <div className="skeleton-shimmer h-4 w-72 rounded" />
        </div>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-lg border bg-card p-4">
              <div className="skeleton-shimmer h-4 w-20 rounded mb-2" />
              <div className="skeleton-shimmer h-5 w-24 rounded" />
            </div>
          ))}
        </div>
        <div className="rounded-lg border bg-card p-4">
          <div className="skeleton-shimmer h-5 w-32 rounded mb-4" />
          <div className="space-y-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex items-center justify-between">
                <div className="skeleton-shimmer h-4 w-20 rounded" />
                <div className="skeleton-shimmer h-4 w-24 rounded" />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight" data-testid="page-heading">{t('systemHealth:title')}</h1>
        <p className="text-sm text-muted-foreground">{t('systemHealth:subtitle')}</p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Database className="h-4 w-4" />
            {t('systemHealth:database')}
          </div>
          <div className="mt-1 flex items-center gap-2">
            {health?.database?.status === 'ok' ? (
              <CheckCircle2 className="h-5 w-5 text-green-500" />
            ) : (
              <XCircle className="h-5 w-5 text-red-500" />
            )}
            <span className="font-medium">{health?.database?.status === 'ok' ? t('systemHealth:connected') : t('systemHealth:disconnected')}</span>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Server className="h-4 w-4" />
            {t('systemHealth:nodeVersion')}
          </div>
          <p className="mt-1 text-lg font-bold">{health?.nodeVersion}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Globe className="h-4 w-4" />
            {t('systemHealth:environment')}
          </div>
          <p className="mt-1 text-lg font-bold capitalize">{health?.environment}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Activity className="h-4 w-4" />
            {t('systemHealth:appVersion')}
          </div>
          <p className="mt-1 text-lg font-bold">v{health?.appVersion}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Clock className="h-4 w-4" />
            {t('systemHealth:uptime')}
          </div>
          <p className="mt-1 text-lg font-bold">{health ? formatUptime(health.uptime) : '-'}</p>
        </div>

        <div className="rounded-lg border bg-card p-4">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Cpu className="h-4 w-4" />
            {t('systemHealth:platform')}
          </div>
          <p className="mt-1 text-lg font-bold capitalize">{health?.platform}</p>
        </div>
      </div>

      {health?.memory && (
        <div className="rounded-lg border bg-card">
          <div className="border-b px-4 py-3">
            <h3 className="flex items-center gap-2 font-semibold">
              <MemoryStick className="h-4 w-4" />
              {t('systemHealth:memoryUsage')}
            </h3>
          </div>
          <div className="divide-y">
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{t('systemHealth:heapUsed')}</span>
              <span className="text-sm font-medium">{formatBytes(health.memory.heapUsed)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{t('systemHealth:heapTotal')}</span>
              <span className="text-sm font-medium">{formatBytes(health.memory.heapTotal)}</span>
            </div>
            <div className="flex items-center justify-between px-4 py-3">
              <span className="text-sm">{t('systemHealth:rss')}</span>
              <span className="text-sm font-medium">{formatBytes(health.memory.rss)}</span>
            </div>
            <div className="px-4 py-3">
              <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-primary"
                  style={{
                    width: `${Math.min((health.memory.heapUsed / health.memory.heapTotal) * 100, 100)}%`,
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
