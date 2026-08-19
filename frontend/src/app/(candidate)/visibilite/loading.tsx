import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function VisibiliteLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-xl items-center justify-between border-b border-surface-container-high bg-surface px-4 py-4 lg:max-w-6xl lg:px-10">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-6" />
      </header>

      <main className="mx-auto mt-6 max-w-xl px-4 lg:max-w-6xl lg:px-10">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-10">
          <section className="mb-10 flex flex-col items-center">
            <Skeleton className="h-48 w-48 rounded-full" />
            <Skeleton className="mt-4 h-7 w-32 rounded-full" />
          </section>

          <div>
            <section className="mb-10 space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
                  <div className="mb-2 flex items-center justify-between">
                    <Skeleton className="h-3 w-40" />
                    <Skeleton className="h-3 w-14" />
                  </div>
                  <Skeleton className="h-2 w-full rounded-full" />
                </div>
              ))}
            </section>

            <section className="mb-10 space-y-4">
              <Skeleton className="h-5 w-56" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle space-y-3">
                  <div className="flex gap-3">
                    <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
                    <Skeleton className="h-8 flex-1" />
                  </div>
                  <Skeleton className="h-11 w-full rounded-pillar" />
                </div>
              ))}
            </section>

            <section className="mb-10">
              <div className="mb-4 flex items-center justify-between">
                <Skeleton className="h-5 w-40" />
                <Skeleton className="h-4 w-16" />
              </div>
              <div className="flex gap-4 overflow-x-auto pb-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-32 w-32 shrink-0 rounded-pillar" />
                ))}
              </div>
            </section>
          </div>
        </div>
      </main>
    </SkeletonPage>
  );
}
