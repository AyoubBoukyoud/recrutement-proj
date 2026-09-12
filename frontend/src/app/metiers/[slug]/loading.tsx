import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function MetierLoading() {
  return (
    <SkeletonPage>
      <header className="fixed inset-x-0 top-0 z-40 bg-surface/95 shadow-soft backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-6 py-4 lg:px-12">
          <Skeleton className="h-9 w-9 rounded-lg" />
          <Skeleton className="h-4 w-24" />
          <div className="ms-6 hidden items-center gap-6 lg:flex">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-16" />
            ))}
          </div>
          <div className="ms-auto flex items-center gap-3">
            <Skeleton className="h-9 w-9 rounded-full" />
            <Skeleton className="h-9 w-9 rounded-xl lg:hidden" />
          </div>
        </div>
      </header>

      <main className="pt-28 lg:pt-36">
        <div className="mx-auto w-full max-w-[820px] px-6 lg:px-12">
          <Skeleton className="h-4 w-24" />

          <div className="mt-6 flex items-start gap-4">
            <Skeleton className="h-14 w-14 shrink-0 rounded-2xl" />
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-8 w-64" />
            </div>
          </div>

          <Skeleton className="mt-6 h-16 w-full" />

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <Skeleton className="h-24 w-full rounded-2xl" />
            <Skeleton className="h-24 w-full rounded-2xl" />
          </div>

          <div className="mt-10 space-y-4">
            <Skeleton className="h-6 w-48" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-3 w-full" />
            ))}
          </div>

          <div className="mt-10 space-y-4">
            <Skeleton className="h-6 w-40" />
            <div className="grid gap-2.5 sm:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-xl" />
              ))}
            </div>
          </div>

          <Skeleton className="mt-8 h-20 w-full rounded-xl" />
          <Skeleton className="mt-10 h-56 w-full rounded-[1.75rem]" />

          <div className="mt-14 space-y-4 pb-20">
            <Skeleton className="h-6 w-56" />
            <div className="grid gap-2 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} className="h-14 w-full rounded-xl" />
              ))}
            </div>
          </div>
        </div>
      </main>

      <footer className="border-t border-outline-variant/50 bg-surface-container/60">
        <div className="mx-auto w-full max-w-[1280px] px-6 py-14 lg:px-12">
          <div className="grid gap-10 lg:grid-cols-12">
            <div className="space-y-3 lg:col-span-3">
              <Skeleton className="h-6 w-32" />
              <Skeleton className="h-10 w-full max-w-[220px]" />
            </div>
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-3 lg:col-span-3">
                <Skeleton className="h-2.5 w-20" />
                {Array.from({ length: 4 }).map((_, j) => (
                  <Skeleton key={j} className="h-3 w-24" />
                ))}
              </div>
            ))}
          </div>
        </div>
      </footer>
    </SkeletonPage>
  );
}
