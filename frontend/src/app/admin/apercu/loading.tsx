import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminOverviewLoading() {
  return (
    <SkeletonPage className="grid gap-6">
      <div className="mb-4 grid gap-1">
        <Skeleton className="h-2.5 w-24" />
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-3 w-56" />
      </div>

      <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="flex items-center gap-3 rounded-card border border-outline-variant bg-surface-lowest p-4">
            <Skeleton className="h-11 w-11 shrink-0 rounded-full" />
            <div className="min-w-0 flex-1 space-y-1.5">
              <Skeleton className="h-5 w-12" />
              <Skeleton className="h-2.5 w-24" />
            </div>
          </div>
        ))}
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="rounded-card border border-outline-variant bg-surface-lowest p-6">
            <div className="mb-4 flex items-center gap-2.5">
              <Skeleton className="h-8 w-8 rounded-element" />
              <Skeleton className="h-2.5 w-28" />
            </div>
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(120px,1fr))]">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-16" />
                  <Skeleton className="h-6 w-10" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
