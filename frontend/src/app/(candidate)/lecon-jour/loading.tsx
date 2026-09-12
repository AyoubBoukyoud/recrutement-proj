import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function LeconJourLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-1.5 lg:px-4">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-44 flex-1" />
        <Skeleton className="h-7 w-20 rounded-full" />
      </header>

      <main className="mx-auto w-full max-w-[600px] space-y-8 px-4 py-6 lg:max-w-[720px] lg:px-10 lg:py-10">
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <Skeleton className="h-2.5 w-44" />
            <Skeleton className="h-2.5 w-8" />
          </div>
          <div className="flex h-2.5 gap-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <Skeleton key={i} className="h-2.5 flex-1 rounded-full" />
            ))}
          </div>
        </section>

        <article className="rounded-xl border border-outline-variant bg-surface-container-lowest p-8 shadow-[0px_4px_24px_rgba(0,69,35,0.06)]">
          <div className="flex flex-col items-center space-y-6 text-center">
            <Skeleton className="h-24 w-24 rounded-full" />
            <Skeleton className="h-7 w-36" />
            <div className="w-full space-y-3 border-t border-outline-variant/30 pt-4">
              <Skeleton className="h-11 w-full rounded-lg" />
              <Skeleton className="h-11 w-full rounded-lg" />
            </div>
            <div className="grid w-full grid-cols-2 gap-4 pt-4">
              <Skeleton className="h-12 w-full rounded-pillar" />
              <Skeleton className="h-12 w-full rounded-pillar" />
            </div>
          </div>
        </article>

        <section className="space-y-4">
          <Skeleton className="h-5 w-28" />
          <div className="space-y-6 rounded-xl border border-outline-variant bg-surface-container-lowest p-6">
            <Skeleton className="h-4 w-3/4" />
            <div className="grid grid-cols-1 gap-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </section>

        <Skeleton className="h-14 w-full rounded-xl" />
      </main>
    </SkeletonPage>
  );
}
