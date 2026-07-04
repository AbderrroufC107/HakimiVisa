import { cn } from '@/lib/utils';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface SkeletonProps {
  className?: string;
}

function SkeletonBlock({ className }: SkeletonProps) {
  return <div className={cn('skeleton-shimmer rounded-md', className)} />;
}

export function TableSkeleton({ rows = 5, cols = 5 }: { rows?: number; cols?: number }) {
  return (
    <div className="rounded-xl border">
      <div className="border-b bg-muted/50 px-4 py-3.5">
        <div className="flex gap-4">
          {Array.from({ length: cols }).map((_, i) => (
            <SkeletonBlock key={i} className="h-4 flex-1" />
          ))}
        </div>
      </div>
      {Array.from({ length: rows }).map((_, r) => (
        <div key={r} className="border-b px-4 py-3.5">
          <div className="flex gap-4">
            {Array.from({ length: cols }).map((_, c) => (
              <SkeletonBlock key={c} className={cn('h-4', c === 0 ? 'w-1/3' : 'flex-1')} />
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

export function CardSkeleton({ count = 3 }: { count?: number }) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      {Array.from({ length: count }).map((_, i) => (
        <Card key={i} className="overflow-hidden">
          <CardHeader className="pb-2">
            <SkeletonBlock className="h-4 w-24" />
          </CardHeader>
          <CardContent className="p-5 pt-0">
            <SkeletonBlock className="h-8 w-16 mb-2" />
            <SkeletonBlock className="h-3 w-32" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

export function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <SkeletonBlock className="h-6 w-48" />
        </CardHeader>
        <CardContent>
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i}>
                <SkeletonBlock className="h-3 w-20 mb-1.5" />
                <SkeletonBlock className="h-5 w-40" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <SkeletonBlock className="h-64 w-full rounded-xl" />
    </div>
  );
}

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <SkeletonBlock className="h-7 w-64 mb-1" />
          <SkeletonBlock className="h-4 w-40" />
        </div>
        <SkeletonBlock className="h-9 w-28 rounded-md" />
      </div>
      <Card>
        <CardHeader>
          <SkeletonBlock className="h-5 w-48" />
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid gap-4 md:grid-cols-2">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i}>
                <SkeletonBlock className="h-3 w-20 mb-1.5" />
                <SkeletonBlock className="h-5 w-full" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      <Card>
        <CardContent className="p-6">
          <SkeletonBlock className="h-4 w-full mb-3" />
          <SkeletonBlock className="h-4 w-3/4 mb-3" />
          <SkeletonBlock className="h-4 w-1/2" />
        </CardContent>
      </Card>
    </div>
  );
}

export function PageSkeleton() {
  return (
    <div className="space-y-6">
      <SkeletonBlock className="h-7 w-48 mb-1" />
      <SkeletonBlock className="h-4 w-72 mb-6" />
      <CardSkeleton count={4} />
      <TableSkeleton />
    </div>
  );
}
