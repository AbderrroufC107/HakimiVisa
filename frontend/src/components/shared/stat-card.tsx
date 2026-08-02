import { type LucideIcon } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: { value: number; positive: boolean };
  subtitle?: string;
  onClick?: () => void;
  className?: string;
  color?: string;
}

export function StatCard({
  title,
  value,
  icon: Icon,
  trend,
  subtitle,
  onClick,
  className,
  color,
}: StatCardProps) {
  return (
    <Card
      className={cn(
        'group shadow-sm transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-3">
          <p className="line-clamp-2 min-h-[2rem] text-[11px] font-semibold uppercase leading-4 tracking-wide text-muted-foreground">
            {title}
          </p>
          <div
            className="shrink-0 rounded-lg bg-primary/10 p-2 text-primary transition-transform duration-200 group-hover:scale-105"
            style={color ? { backgroundColor: `${color}15`, color } : undefined}
          >
            <Icon className="h-4 w-4" />
          </div>
        </div>

        <p className="mt-2 text-3xl font-bold leading-none tracking-tight tabular-nums">
          {value}
        </p>

        {(trend || subtitle) && (
          <div className="mt-2 flex items-center gap-2">
            {trend && (
              <span
                className={cn(
                  'inline-flex items-center rounded-full px-1.5 py-0.5 text-[11px] font-semibold tabular-nums ring-1 ring-inset',
                  trend.positive
                    ? 'bg-emerald-50 text-emerald-700 ring-emerald-600/20 dark:bg-emerald-500/10 dark:text-emerald-300 dark:ring-emerald-400/25'
                    : 'bg-red-50 text-red-700 ring-red-600/20 dark:bg-red-500/10 dark:text-red-300 dark:ring-red-400/25',
                )}
              >
                {trend.positive ? '+' : ''}
                {trend.value}%
              </span>
            )}
            {subtitle && (
              <span className="truncate text-xs text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
