import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { VisaStatus } from '@/types';

/**
 * Each status carries a soft fill + inset ring (readable in both themes) and a
 * saturated dot so the status is scannable without relying on fill contrast.
 */
const statusConfig: Record<VisaStatus, { className: string; dot: string }> = {
  EN_ATTENTE: {
    className: 'bg-yellow-50 text-yellow-800 ring-yellow-600/20 dark:bg-yellow-500/10 dark:text-yellow-300 dark:ring-yellow-400/25',
    dot: 'bg-yellow-500',
  },
  DOSSIER_INCOMPLET: {
    className: 'bg-amber-50 text-amber-800 ring-amber-600/20 dark:bg-amber-500/10 dark:text-amber-300 dark:ring-amber-400/25',
    dot: 'bg-amber-500',
  },
  EN_TRAITEMENT: {
    className: 'bg-blue-50 text-blue-800 ring-blue-600/20 dark:bg-blue-500/10 dark:text-blue-300 dark:ring-blue-400/25',
    dot: 'bg-blue-500',
  },
  RDV_OK: {
    className: 'bg-purple-50 text-purple-800 ring-purple-600/20 dark:bg-purple-500/10 dark:text-purple-300 dark:ring-purple-400/25',
    dot: 'bg-purple-500',
  },
  LIVREE: {
    className: 'bg-teal-50 text-teal-800 ring-teal-600/20 dark:bg-teal-500/10 dark:text-teal-300 dark:ring-teal-400/25',
    dot: 'bg-teal-500',
  },
};

interface StatusBadgeProps {
  status: VisaStatus;
  size?: 'sm' | 'md';
  className?: string;
}

export function StatusBadge({ status, size = 'md', className }: StatusBadgeProps) {
  const { t } = useTranslation();
  const config = statusConfig[status];
  if (!config) return null;

  return (
    <span
      className={cn(
        'inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-medium ring-1 ring-inset',
        size === 'sm' ? 'px-1.5 py-0.5 text-[11px]' : 'px-2 py-0.5 text-xs',
        config.className,
        className,
      )}
    >
      <span className={cn('h-1.5 w-1.5 shrink-0 rounded-full', config.dot)} aria-hidden />
      {t('status:' + status)}
    </span>
  );
}
