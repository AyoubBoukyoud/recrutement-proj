import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function SimulateurSalaireLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-28">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-4 shadow-subtle lg:px-10">
        <div className="flex items-center gap-3">
          <Skeleton className="h-6 w-6 rounded" />
          <Skeleton className="h-4 w-28" />
        </div>
        <Skeleton className="h-10 w-10 rounded-full" />
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 space-y-6 lg:max-w-6xl lg:px-10 lg:py-8">
        <section className="space-y-2 lg:max-w-2xl">
          <Skeleton className="h-6 w-56" />
          <Skeleton className="h-3 w-full" />
        </section>

        <section className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle lg:p-6">
          <div className="space-y-4 lg:grid lg:grid-cols-3 lg:items-end lg:gap-4 lg:space-y-0">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-12 w-full rounded-pillar" />
              </div>
            ))}
            <div className="pt-2 lg:col-span-3 lg:pt-0">
              <Skeleton className="h-12 w-full rounded-pillar lg:mx-auto lg:max-w-xs" />
            </div>
          </div>
        </section>

        <div className="space-y-6 lg:grid lg:grid-cols-[1fr_360px] lg:items-start lg:gap-6 lg:space-y-0">
          <div className="space-y-6">
            <Skeleton className="h-48 w-full rounded-xl" />
            <Skeleton className="h-72 w-full rounded-xl" />
          </div>

          <div className="mt-6 space-y-6 lg:mt-0">
            <Skeleton className="h-64 w-full rounded-xl" />
            <Skeleton className="h-40 w-full rounded-xl" />
            <Skeleton className="hidden h-11 w-full rounded-pillar lg:block" />
          </div>
        </div>
      </main>

      <footer className="fixed bottom-0 inset-x-0 z-40 mx-auto max-w-xl border-t border-outline-variant bg-surface-container-lowest p-4 pb-[max(1rem,env(safe-area-inset-bottom))] shadow-subtle flex justify-center lg:hidden">
        <Skeleton className="h-11 w-full rounded-pillar" />
      </footer>
    </SkeletonPage>
  );
}
