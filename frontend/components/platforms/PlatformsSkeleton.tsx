import { Skeleton } from '@/components/ui/Skeleton';

function PlatformCardSkeleton() {
  return (
    <div className="creator-panel-lg flex flex-col gap-4">
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Skeleton className="size-9 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </div>

      <div className="grid grid-cols-2 gap-3">
        <Skeleton className="h-16 rounded-xl" />
        <Skeleton className="h-16 rounded-xl" />
      </div>

      <div className="flex items-center justify-between gap-3 border-t-2 border-[color:var(--border)] pt-3">
        <Skeleton className="h-3 w-28" />
        <Skeleton className="h-8 w-20 rounded-xl" />
      </div>
    </div>
  );
}

export function PlatformsSkeleton() {
  return (
    <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
      <PlatformCardSkeleton />
      <PlatformCardSkeleton />
      <PlatformCardSkeleton />
    </div>
  );
}
