import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function ParrainageLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-surface-container-high bg-surface px-4 shadow-subtle lg:px-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-7 w-7 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 lg:max-w-5xl lg:px-10 lg:py-8">
        <div className="mb-6 space-y-2 lg:max-w-2xl">
          <Skeleton className="h-6 w-52" />
          <Skeleton className="h-3 w-full" />
        </div>

        <div className="lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-6">
          <div className="mb-6 space-y-4 rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle lg:col-start-1 lg:row-start-1 lg:mb-0">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-4 w-52" />
            <Skeleton className="h-16 w-full rounded-lg" />
            <div className="flex flex-col gap-3 sm:flex-row">
              <Skeleton className="h-11 flex-1 rounded-pillar" />
              <Skeleton className="h-11 flex-1 rounded-pillar" />
            </div>
          </div>

          <div className="mb-6 flex flex-col items-center justify-center gap-3 rounded-xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle lg:col-start-2 lg:row-start-1 lg:row-span-2 lg:mb-0">
            <Skeleton className="h-36 w-36 rounded-xl" />
            <Skeleton className="h-2.5 w-40" />
          </div>

          <div className="mb-6 space-y-3 lg:col-start-1 lg:row-start-2 lg:mb-0">
            <Skeleton className="h-16 w-full rounded-xl" />
            <Skeleton className="h-16 w-full rounded-xl" />
          </div>

          <div className="mb-6 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest shadow-subtle lg:col-span-2 lg:mt-6 lg:mb-0">
            <div className="border-b border-outline-variant px-4 py-3">
              <Skeleton className="h-3.5 w-44" />
            </div>
            <div className="divide-y divide-outline-variant">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center justify-between p-4">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-10 w-10 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-24" />
                      <Skeleton className="h-2.5 w-32" />
                    </div>
                  </div>
                  <Skeleton className="h-6 w-20 rounded-full" />
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="flex justify-center pt-2">
          <Skeleton className="h-11 w-48 rounded-pillar" />
        </div>
      </main>
    </SkeletonPage>
  );
}
