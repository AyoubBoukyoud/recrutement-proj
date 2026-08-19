import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function QuizMetierLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-20 flex h-16 w-full items-center gap-4 border-b border-outline-variant bg-surface px-4 lg:px-10">
        <Skeleton className="h-6 w-6 rounded-full" />
        <Skeleton className="h-4 w-28" />
      </header>

      <main className="mx-auto max-w-[800px] space-y-8 px-4 pt-6 lg:px-10">
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <Skeleton className="h-4 w-40" />
            <Skeleton className="h-3.5 w-28" />
          </div>
          <Skeleton className="h-2 w-full rounded-full" />
        </section>

        <article className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-sm">
          <Skeleton className="mb-4 h-5 w-full max-w-md" />
          <Skeleton className="h-7 w-40 rounded-lg" />
        </article>

        <div className="mb-12 grid grid-cols-1 gap-4 md:grid-cols-2">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex items-center rounded-xl border border-outline-variant bg-surface-container-lowest p-4">
              <Skeleton className="mr-4 h-10 w-10 rounded-lg" />
              <Skeleton className="h-3.5 flex-1" />
            </div>
          ))}
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />
      </main>
    </SkeletonPage>
  );
}
