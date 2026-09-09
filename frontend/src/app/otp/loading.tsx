import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function OtpLoading() {
  return (
    <SkeletonPage className="lg:flex lg:min-h-screen lg:items-stretch lg:justify-center lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40 lg:py-10">
      <div className="lg:w-full lg:max-w-md lg:overflow-hidden lg:rounded-card lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
          <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
            <div className="flex items-center gap-4">
              <Skeleton className="h-10 w-10 rounded-full" />
              <Skeleton className="h-4 w-40" />
            </div>
          </header>

          <div className="flex flex-1 flex-col items-center justify-center px-6 py-10">
            <Skeleton className="mb-6 h-20 w-20 rounded-full" />
            <Skeleton className="mb-2 h-6 w-48" />
            <Skeleton className="mb-8 h-3 w-56" />

            <div className="flex w-full flex-col items-center gap-6">
              <div className="flex items-center justify-center gap-2">
                {Array.from({ length: 6 }).map((_, i) => (
                  <Skeleton key={i} className="h-12 w-11 rounded-pillar" />
                ))}
              </div>
              <Skeleton className="h-3 w-32" />
              <Skeleton className="h-14 w-full max-w-[340px] rounded-pillar" />
            </div>
          </div>
        </main>
      </div>
    </SkeletonPage>
  );
}
