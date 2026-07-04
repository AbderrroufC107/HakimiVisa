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
        'transition-all duration-200 hover:shadow-md',
        onClick && 'cursor-pointer',
        className,
      )}
      onClick={onClick}
    >
      <CardContent className="p-5">
        <div className="flex items-start justify-between">
          <div className="space-y-1.5">
            <p className="text-sm font-medium text-muted-foreground">{title}</p>
            <p className="text-2xl font-bold tracking-tight">{value}</p>
            {(trend || subtitle) && (
              <div className="flex items-center gap-2">
                {trend && (
                  <span
                    className={cn(
                      'inline-flex items-center text-xs font-medium',
                      trend.positive ? 'text-success' : 'text-destructive',
                    )}
                  >
                    {trend.positive ? '+' : ''}
                    {trend.value}%
                  </span>
                )}
                {subtitle && (
                  <span className="text-xs text-muted-foreground">{subtitle}</span>
                )}
              </div>
            )}
          </div>
          <div
            className="rounded-xl bg-primary/10 p-2.5 text-primary"
            style={color ? { backgroundColor: `${color}15`, color } : undefined}
          >
            <Icon className="h-5 w-5" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
