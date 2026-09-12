import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function ReclamationLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-container bg-surface px-2.5 lg:px-4">
        <Skeleton className="mr-4 h-5 w-5 rounded" />
        <Skeleton className="h-4 w-32" />
      </header>

      <main className="mx-auto max-w-md space-y-8 px-6 pt-8 lg:max-w-5xl lg:px-10 lg:pt-10">
        <div className="flex flex-col items-center lg:items-start">
          <Skeleton className="mb-4 h-24 w-24 rounded-full" />
          <Skeleton className="h-6 w-64" />
          <Skeleton className="mt-2 h-3 w-52" />
        </div>

        <div className="space-y-8 lg:grid lg:grid-cols-[1fr_340px] lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-8">
            <Skeleton className="h-16 w-full rounded-xl" />

            <section className="space-y-6">
              <div className="space-y-2">
                <Skeleton className="h-3 w-40" />
                <Skeleton className="h-12 w-full rounded-xl" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-3 w-24" />
                <Skeleton className="h-36 w-full rounded-xl" />
              </div>
              <Skeleton className="h-20 w-full rounded-xl" />
            </section>

            <Skeleton className="h-14 w-full rounded-xl" />
          </div>

          <section className="space-y-3 pb-6">
            <Skeleton className="h-4 w-40" />
            <div className="space-y-2.5">
              {Array.from({ length: 2 }).map((_, i) => (
                <Skeleton key={i} className="h-16 w-full rounded-xl" />
              ))}
            </div>
          </section>
        </div>
      </main>
    </SkeletonPage>
  );
}
