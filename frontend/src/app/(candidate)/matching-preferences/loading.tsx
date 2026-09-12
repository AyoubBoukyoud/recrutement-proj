import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function MatchingPreferencesLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-background pb-32">
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-1.5 lg:max-w-5xl lg:px-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" />
            <Skeleton className="h-4 w-36" />
          </div>
          <Skeleton className="h-10 w-10 rounded-full" />
        </div>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-4 py-4 lg:max-w-5xl lg:px-10 lg:py-8">
        <div className="space-y-2 py-2">
          <Skeleton className="h-6 w-72" />
          <Skeleton className="h-3 w-full max-w-md" />
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
          {Array.from({ length: 4 }).map((_, s) => (
            <section key={s} className="space-y-4 rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle">
              <Skeleton className="h-4 w-48" />
              <div className="grid grid-cols-2 gap-3 pt-1">
                {Array.from({ length: 4 }).map((_, i) => (
                  <Skeleton key={i} className="h-11 w-full rounded-lg" />
                ))}
              </div>
            </section>
          ))}
        </div>

        <Skeleton className="h-48 w-full rounded-xl" />
        <Skeleton className="mx-auto h-14 w-full max-w-sm rounded-pillar" />
      </main>
    </SkeletonPage>
  );
}
