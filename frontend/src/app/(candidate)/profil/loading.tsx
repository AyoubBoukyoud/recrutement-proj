import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

const TOOL_LINK_COUNT = 7;

export default function ProfilLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-2.5 py-1.5 backdrop-blur-md lg:px-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-36" />
        <Skeleton className="h-5 w-5 rounded" />
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6 lg:max-w-6xl lg:px-10 lg:pt-8">
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-6 lg:col-span-2">
            <section className="flex flex-col items-center gap-3 text-center">
              <Skeleton className="h-32 w-32 rounded-full" />
              <div className="space-y-2">
                <Skeleton className="mx-auto h-6 w-32" />
                <Skeleton className="mx-auto h-3 w-20" />
                <Skeleton className="mx-auto h-5 w-24 rounded-full" />
              </div>
            </section>

            <section className="flex items-start gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
              <Skeleton className="h-12 w-12 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-40" />
              </div>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-3">
            <section className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-28 w-[220px] shrink-0 rounded-xl" />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <Skeleton className="aspect-video w-full rounded-xl" />
            </section>

            <section className="space-y-3">
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-24 w-full rounded-xl" />
            </section>

            <section className="space-y-3">
              <Skeleton className="h-5 w-56" />
              <div className="grid grid-cols-1 gap-2.5">
                {Array.from({ length: TOOL_LINK_COUNT }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-pillar" />
                ))}
              </div>
            </section>

            <section className="space-y-3">
              <Skeleton className="h-5 w-40" />
              <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
              </div>
            </section>
          </div>
        </div>

        <Skeleton className="h-12 w-full rounded-pillar lg:mx-auto lg:max-w-sm" />
      </main>
    </SkeletonPage>
  );
}
