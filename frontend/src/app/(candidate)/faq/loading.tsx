import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function FaqLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-6 lg:px-10">
        <Skeleton className="mr-4 h-5 w-5 rounded" />
        <Skeleton className="h-4 w-32" />
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8 lg:max-w-4xl lg:px-10 lg:pt-10">
        <div className="flex flex-col items-center text-center">
          <Skeleton className="mb-4 h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-56" />
          <Skeleton className="mt-2 h-3 w-72" />
        </div>

        <div className="space-y-8 lg:grid lg:grid-cols-2 lg:items-start lg:gap-x-8 lg:gap-y-8 lg:space-y-0">
          {Array.from({ length: 4 }).map((_, s) => (
            <section key={s} className="space-y-3">
              <div className="flex items-center gap-2 px-1">
                <Skeleton className="h-5 w-5 rounded" />
                <Skeleton className="h-3.5 w-40" />
              </div>
              <div className="space-y-2.5">
                {Array.from({ length: 2 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-xl" />
                ))}
              </div>
            </section>
          ))}
        </div>

        <Skeleton className="h-14 w-full rounded-xl" />
      </main>
    </SkeletonPage>
  );
}
