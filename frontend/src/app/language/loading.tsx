import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function LanguageLoading() {
  return (
    <SkeletonPage className="lg:flex lg:min-h-screen lg:items-stretch lg:justify-center lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40 lg:py-10">
      <div className="lg:w-full lg:max-w-md lg:overflow-hidden lg:rounded-card lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
          <nav className="flex items-center gap-3 px-6 py-4 border-b border-surface-container-high">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-4 w-28" />
          </nav>

          <div className="flex-1 px-6 pt-6 pb-4">
            <Skeleton className="mb-2 h-2.5 w-40" />
            <Skeleton className="h-8 w-full max-w-xs" />
            <Skeleton className="mt-4 h-3 w-full" />

            <div className="mt-8 space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4">
                  <Skeleton className="h-12 w-12 shrink-0 rounded-pillar" />
                  <div className="flex-grow space-y-1.5">
                    <Skeleton className="h-4 w-24" />
                    <Skeleton className="h-2.5 w-16" />
                  </div>
                  <Skeleton className="h-5 w-5 shrink-0 rounded-full" />
                </div>
              ))}
            </div>
          </div>

          <footer className="border-t border-outline-variant bg-surface-container-lowest p-6">
            <Skeleton className="h-14 w-full rounded-pillar" />
          </footer>
        </main>
      </div>
    </SkeletonPage>
  );
}
