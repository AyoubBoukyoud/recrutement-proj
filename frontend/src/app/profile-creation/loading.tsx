import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function ProfileCreationLoading() {
  return (
    <SkeletonPage className="lg:min-h-screen lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40">
      <div className="lg:mx-auto lg:max-w-md lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        <main className="mx-auto min-h-screen max-w-md bg-surface pb-32 shadow-subtle flex flex-col">
          <header className="sticky top-0 z-10 border-b border-surface-container-high bg-surface px-6 py-4">
            <div className="flex items-center justify-between">
              <Skeleton className="h-4 w-14" />
              <Skeleton className="h-4 w-24" />
              <span className="w-12" />
            </div>
          </header>

          <div className="flex-1 px-6 pt-6">
            <div className="mb-6">
              <div className="mb-2 flex items-end justify-between">
                <Skeleton className="h-2.5 w-16" />
                <Skeleton className="h-2.5 w-24" />
              </div>
              <div className="flex gap-1.5">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-2 flex-1 rounded-full" />
                ))}
              </div>
            </div>

            <div className="mb-6 space-y-2">
              <Skeleton className="h-6 w-64" />
              <Skeleton className="h-4 w-40" />
            </div>

            <div className="space-y-4">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="space-y-1.5">
                  <Skeleton className="h-2.5 w-32" />
                  <Skeleton className="h-14 w-full rounded-pillar" />
                </div>
              ))}
            </div>
          </div>

          <div className="fixed inset-x-0 bottom-0 z-10 mx-auto max-w-md border-t border-outline-variant bg-surface-container-lowest px-6 pb-[max(1.5rem,env(safe-area-inset-bottom))] pt-6 shadow-subtle">
            <Skeleton className="h-14 w-full rounded-pillar" />
          </div>
        </main>
      </div>
    </SkeletonPage>
  );
}
