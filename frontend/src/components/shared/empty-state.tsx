import { type LucideIcon, Inbox } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
  size?: 'sm' | 'md' | 'lg';
}

export function EmptyState({
  icon: Icon = Inbox,
  title,
  description,
  actionLabel,
  onAction,
  className = '',
  size = 'md',
}: EmptyStateProps) {
  const sizes = {
    sm: { icon: 'h-8 w-8', wrapper: 'p-2.5', title: 'text-sm', gap: 'gap-2' },
    md: { icon: 'h-10 w-10', wrapper: 'p-3', title: 'text-base', gap: 'gap-3' },
    lg: { icon: 'h-12 w-12', wrapper: 'p-4', title: 'text-lg', gap: 'gap-4' },
  };

  const s = sizes[size];

  return (
    <div className={`flex flex-col items-center justify-center py-12 text-center animate-fade-in ${className}`}>
      <div className={`rounded-2xl bg-muted/50 ring-1 ring-border/50 ${s.wrapper}`}>
        <Icon className={`${s.icon} text-muted-foreground/60`} />
      </div>
      <div className={`mt-4 flex flex-col items-center ${s.gap}`}>
        <h3 className={`${s.title} font-semibold text-foreground`}>{title}</h3>
        {description && (
          <p className="text-sm text-muted-foreground max-w-sm text-balance">{description}</p>
        )}
        {actionLabel && onAction && (
          <Button className="mt-2" onClick={onAction} size={size === 'sm' ? 'sm' : 'default'}>
            {actionLabel}
          </Button>
        )}
      </div>
    </div>
  );
}
