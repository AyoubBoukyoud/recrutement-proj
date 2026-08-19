import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminStageLoading() {
  return (
    <SkeletonPage className="rounded-card border border-outline-variant bg-surface-lowest p-6">
      <div className="mb-4 grid gap-1">
        <Skeleton className="h-2.5 w-28" />
        <Skeleton className="h-6 w-44" />
        <Skeleton className="h-3 w-72" />
      </div>

      <div className="mb-4 grid grid-cols-1 items-end gap-2 sm:[grid-template-columns:minmax(180px,2fr)_minmax(120px,1fr)_minmax(90px,1fr)_auto]">
        <Skeleton className="h-13 w-full rounded-element" />
        <Skeleton className="h-13 w-full rounded-element" />
        <Skeleton className="h-13 w-full rounded-element" />
        <Skeleton className="h-13 w-24 rounded-element" />
      </div>

      <div className="grid gap-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-2">
            <Skeleton className="h-3 w-52" />
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-2.5 w-12" />
            <Skeleton className="ml-auto h-8 w-16 rounded-element" />
          </div>
        ))}
      </div>

      <div className="mt-4 grid gap-2">
        <Skeleton className="h-9 w-40 rounded-element" />
        <Skeleton className="h-4 w-32" />
      </div>
    </SkeletonPage>
  );
}
