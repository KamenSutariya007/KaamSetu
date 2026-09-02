import cn from '../../utils/cn';

export function Skeleton({ className = '' }) {
  return <div className={cn('animate-pulse rounded-lg bg-line/80', className)} aria-hidden="true" />;
}

export function CardSkeleton({ lines = 3 }) {
  return (
    <div className="bg-surface rounded-[14px] border border-line p-5 space-y-3" aria-busy="true">
      <Skeleton className="h-5 w-1/3" />
      <Skeleton className="h-4 w-full" />
      {lines > 2 && <Skeleton className="h-4 w-2/3" />}
      <Skeleton className="h-10 w-full rounded-xl mt-2" />
    </div>
  );
}

export function DashboardSkeleton() {
  return (
    <div className="space-y-6" aria-busy="true">
      <Skeleton className="h-8 w-48" />
      <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="bg-surface rounded-[14px] border border-line p-5 space-y-2">
            <Skeleton className="h-8 w-16" />
            <Skeleton className="h-4 w-24" />
          </div>
        ))}
      </div>
    </div>
  );
}

export function TableSkeleton({ rows = 5 }) {
  return (
    <div className="bg-surface rounded-[14px] border border-line overflow-hidden" aria-busy="true">
      <div className="p-4 border-b border-line"><Skeleton className="h-5 w-32" /></div>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-4 p-4 border-t border-line">
          <Skeleton className="h-4 w-12" />
          <Skeleton className="h-4 flex-1" />
          <Skeleton className="h-4 w-20" />
        </div>
      ))}
    </div>
  );
}
