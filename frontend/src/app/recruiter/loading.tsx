import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function RecruiterLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant bg-surface-lowest px-8 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2.5 w-32" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-9 w-28 rounded-element" />
        </div>
      </header>

      <main className="mx-auto grid max-w-5xl gap-6 px-6 py-8">
        <div className="flex gap-2">
          <Skeleton className="h-9 w-24 rounded-element" />
          <Skeleton className="h-9 w-28 rounded-element" />
        </div>

        <div className="rounded-card border border-outline-variant bg-surface-lowest p-6">
          <div className="mb-4 grid gap-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-16" />
          </div>
          <div className="grid gap-4">
            <Skeleton className="h-13 w-full rounded-element" />
            <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(180px,1fr))]">
              {Array.from({ length: 7 }).map((_, i) => (
                <Skeleton key={i} className="h-13 w-full rounded-element" />
              ))}
            </div>
            <div className="flex flex-wrap gap-6">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-4 w-40" />
              ))}
            </div>
          </div>
          <div className="mt-6 flex gap-2">
            <Skeleton className="h-13 w-32 rounded-element" />
            <Skeleton className="h-13 w-28 rounded-element" />
          </div>
        </div>

        <div className="grid gap-4">
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fill,minmax(260px,1fr))]">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="rounded-card border border-outline-variant bg-surface-lowest p-5">
                <Skeleton className="mb-1 h-4 w-32" />
                <Skeleton className="h-2.5 w-40" />
                <div className="mt-2 flex gap-1.5">
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              </div>
            ))}
          </div>
          <Skeleton className="h-9 w-40 justify-self-end rounded-element" />
        </div>
      </main>
    </SkeletonPage>
  );
}
