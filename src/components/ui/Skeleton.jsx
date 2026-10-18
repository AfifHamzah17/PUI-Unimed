import { cn } from '../../lib/cn.js';

export function Skeleton({ className, style }) {
  return <div className={cn('skel', className)} style={style} aria-hidden="true" />;
}

export function CardSkeleton({ className }) {
  return (
    <div className={cn('rounded-3xl border border-line bg-surface p-6', className)} aria-hidden="true">
      <Skeleton className="h-4 w-24" />
      <Skeleton className="mt-5 h-6 w-4/5" />
      <Skeleton className="mt-2 h-6 w-3/5" />
      <Skeleton className="mt-6 h-3 w-full" />
      <Skeleton className="mt-2 h-3 w-5/6" />
    </div>
  );
}

export function RouteSkeleton() {
  return (
    <div className="shell pt-40 pb-24" role="status" aria-label="Memuat halaman">
      <Skeleton className="h-3 w-40" />
      <Skeleton className="mt-6 h-12 w-3/4 max-w-xl" />
      <Skeleton className="mt-4 h-4 w-full max-w-lg" />
      <div className="mt-12 grid gap-5 md:grid-cols-2">
        <CardSkeleton />
        <CardSkeleton />
      </div>
    </div>
  );
}
