import { useTranslation } from 'react-i18next';
import { cn } from '@/lib/utils';
import type { VisaStatus } from '@/types';

const statusConfig: Record<VisaStatus, { className: string }> = {
  EN_ATTENTE: { className: 'bg-yellow-50 text-yellow-800 border-yellow-300 dark:bg-yellow-950 dark:text-yellow-300' },
  EN_TRAITEMENT: { className: 'bg-blue-50 text-blue-800 border-blue-300 dark:bg-blue-950 dark:text-blue-300' },
  RDV_OK: { className: 'bg-purple-50 text-purple-800 border-purple-300 dark:bg-purple-950 dark:text-purple-300' },
  VISA_OK: { className: 'bg-green-50 text-green-800 border-green-300 dark:bg-green-950 dark:text-green-300' },
  VISA_REFUSEE: { className: 'bg-red-50 text-red-800 border-red-300 dark:bg-red-950 dark:text-red-300' },
  LIVREE: { className: 'bg-teal-50 text-teal-800 border-teal-300 dark:bg-teal-950 dark:text-teal-300' },
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
        'inline-flex items-center rounded-md border px-2 py-0.5 font-medium',
        size === 'sm' ? 'text-[10px]' : 'text-xs',
        config.className,
        className,
      )}
    >
      {t('status:' + status)}
    </span>
  );
}
