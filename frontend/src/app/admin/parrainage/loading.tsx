import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminParrainageLoading() {
  return (
    <SkeletonPage className="rounded-card border border-outline-variant bg-surface-lowest p-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="grid gap-1">
          <Skeleton className="h-2.5 w-20" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>
        <Skeleton className="h-13 w-44 rounded-element" />
      </div>

      <div className="mt-4 grid gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="grid gap-2 border-t border-outline-variant pt-2">
            <div className="flex flex-wrap items-center gap-2">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-3 w-52" />
              <Skeleton className="ml-auto h-3 w-16" />
            </div>
            <Skeleton className="h-2.5 w-64" />
          </div>
        ))}
      </div>

      <div className="mt-4 flex justify-end">
        <Skeleton className="h-9 w-40 rounded-element" />
      </div>
    </SkeletonPage>
  );
}
