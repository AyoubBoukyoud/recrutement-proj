import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function OffresLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-subtle lg:px-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-10 w-10 rounded-full" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 lg:max-w-6xl lg:px-10 lg:py-8">
        <div className="mb-6 lg:max-w-xl">
          <Skeleton className="mb-3 h-6 w-48" />
          <Skeleton className="h-12 w-full rounded-xl" />
        </div>

        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-9 w-24 shrink-0 rounded-full" />
          ))}
        </div>

        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex flex-col justify-between rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
              <div>
                <div className="mb-4 flex items-start justify-between">
                  <div className="flex gap-3">
                    <Skeleton className="h-14 w-14 rounded-lg" />
                    <div className="space-y-2">
                      <Skeleton className="h-3.5 w-32" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                  <Skeleton className="h-8 w-8 rounded-full" />
                </div>
                <div className="mb-5 space-y-2">
                  <Skeleton className="h-2.5 w-28" />
                  <Skeleton className="h-3 w-36" />
                  <div className="flex gap-2 pt-1">
                    <Skeleton className="h-5 w-20 rounded-md" />
                    <Skeleton className="h-5 w-16 rounded-md" />
                  </div>
                </div>
              </div>
              <Skeleton className="h-11 w-full rounded-pillar" />
            </div>
          ))}
        </div>

        <Skeleton className="mt-8 h-40 w-full rounded-2xl" />
      </main>
    </SkeletonPage>
  );
}
