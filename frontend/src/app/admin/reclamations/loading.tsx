import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminReclamationsLoading() {
  return (
    <SkeletonPage className="rounded-card border border-outline-variant bg-surface-lowest p-6">
      <div className="mb-4 grid gap-1">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-6 w-36" />
        <Skeleton className="h-3 w-28" />
      </div>

      <div className="mb-4 flex flex-wrap gap-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-element" />
        ))}
      </div>

      <div className="grid gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="border-t border-outline-variant pt-4">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2.5">
                <Skeleton className="h-7 w-7 rounded-full" />
                <Skeleton className="h-3 w-32" />
              </div>
              <div className="flex gap-2">
                <Skeleton className="h-5 w-16 rounded-full" />
                <Skeleton className="h-5 w-14 rounded-full" />
              </div>
            </div>
            <Skeleton className="mt-2 h-8 w-full" />
            <Skeleton className="mt-2 h-16 w-full rounded-element" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
