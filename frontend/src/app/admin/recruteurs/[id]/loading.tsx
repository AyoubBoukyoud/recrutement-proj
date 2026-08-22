import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminRecruiterDetailLoading() {
  return (
    <SkeletonPage className="rounded-card border border-outline-variant bg-surface-lowest p-6">
      <Skeleton className="mb-6 h-9 w-40 rounded-element" />

      <div className="grid gap-6">
        <div className="grid gap-1.5">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-72" />
          <div className="flex gap-2 pt-1">
            <Skeleton className="h-5 w-16 rounded-full" />
            <Skeleton className="h-5 w-24 rounded-full" />
          </div>
        </div>

        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="grid gap-2 border-t border-outline-variant pt-4">
            <Skeleton className="h-2.5 w-32" />
            <Skeleton className="h-16 w-full rounded-element" />
          </div>
        ))}
      </div>
    </SkeletonPage>
  );
}
