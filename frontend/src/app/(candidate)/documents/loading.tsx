import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function DocumentsLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-outline-variant/30 bg-surface/90 px-6 py-4 backdrop-blur-md lg:px-10">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-44" />
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6 lg:max-w-3xl lg:px-10 lg:pt-8">
        <div className="flex justify-between gap-1 rounded-xl bg-surface-container p-1">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-9 flex-1 rounded-lg" />
          ))}
        </div>

        <Skeleton className="h-48 w-full rounded-2xl" />

        <div className="grid grid-cols-2 gap-4">
          <Skeleton className="h-11 w-full rounded-pillar" />
          <Skeleton className="h-11 w-full rounded-pillar" />
        </div>

        <section className="space-y-3 pb-6">
          <Skeleton className="h-5 w-56" />
          <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-3 lg:space-y-0">
            {Array.from({ length: 2 }).map((_, i) => (
              <Skeleton key={i} className="h-20 w-full rounded-xl" />
            ))}
          </div>
        </section>
      </main>
    </SkeletonPage>
  );
}
