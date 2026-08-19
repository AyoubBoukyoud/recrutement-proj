import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

const QUICK_ACTION_COUNT = 11;

export default function DashboardLoading() {
  return (
    <SkeletonPage>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 py-3.5 backdrop-blur-md lg:px-10 lg:py-5">
        <div className="space-y-2">
          <Skeleton className="h-4 w-40" />
          <Skeleton className="h-2.5 w-24" />
        </div>
        <div className="flex items-center gap-3">
          <Skeleton className="h-9 w-9 rounded-full" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-6 pb-8 pt-4 lg:max-w-6xl lg:px-10 lg:pt-8">
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-6 lg:col-span-2">
            <section className="flex flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
              <div className="mb-4 flex w-full items-center justify-between">
                <Skeleton className="h-4 w-40" />
                <Skeleton className="h-4 w-8" />
              </div>
              <Skeleton className="mb-5 h-36 w-36 rounded-full" />
              <Skeleton className="h-3 w-3/4" />
            </section>

            <div className="flex items-center justify-center">
              <Skeleton className="h-8 w-56 rounded-full" />
            </div>

            <section className="space-y-3">
              <Skeleton className="h-5 w-32" />
              <div className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle divide-y divide-surface-container-high">
                {Array.from({ length: 6 }).map((_, i) => (
                  <div key={i} className="flex items-center gap-3 p-4">
                    <Skeleton className="h-5 w-5 rounded-full" />
                    <Skeleton className="h-3 flex-1" />
                    <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
                ))}
              </div>
            </section>
          </div>

          <section className="space-y-3 lg:col-span-3">
            <Skeleton className="h-5 w-36" />
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {Array.from({ length: QUICK_ACTION_COUNT }).map((_, i) => (
                <div key={i} className="flex flex-col items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle">
                  <Skeleton className="h-11 w-11 rounded-pillar" />
                  <Skeleton className="h-2.5 w-16" />
                </div>
              ))}
            </div>
          </section>
        </div>
      </main>
    </SkeletonPage>
  );
}
