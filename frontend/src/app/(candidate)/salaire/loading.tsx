import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function SalaireLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex w-full items-center gap-4 border-b border-outline-variant/20 bg-surface px-1.5 py-1.5 lg:px-4">
        <Skeleton className="h-5 w-5 rounded" />
        <Skeleton className="h-4 w-44" />
      </header>

      <main className="mx-auto max-w-4xl space-y-6 px-4 py-6 lg:max-w-6xl lg:px-10 lg:py-8">
        <section className="space-y-2 text-center md:text-left">
          <Skeleton className="mx-auto h-6 w-56 md:mx-0" />
          <Skeleton className="mx-auto h-3 w-full max-w-md md:mx-0" />
        </section>

        <section className="rounded-2xl border border-outline-variant/40 bg-surface-container-lowest p-4 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] md:p-6">
          <div className="grid grid-cols-1 items-end gap-4 md:grid-cols-2 lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton className="h-2.5 w-24" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
            ))}
            <div className="flex justify-center pt-2 md:col-span-2 lg:col-span-3">
              <Skeleton className="h-12 w-48 rounded-pillar" />
            </div>
          </div>
        </section>
      </main>
    </SkeletonPage>
  );
}
