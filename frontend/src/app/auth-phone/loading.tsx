import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AuthPhoneLoading() {
  return (
    <SkeletonPage className="lg:flex lg:min-h-screen lg:items-stretch lg:justify-center lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40 lg:py-10">
      <div className="lg:w-full lg:max-w-md lg:overflow-hidden lg:rounded-card lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
          <header className="relative flex flex-col items-center gap-1.5 px-6 py-4 border-b border-surface-container-high">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-2.5 w-32" />
          </header>

          <div className="flex-1 px-6 pt-6">
            <Skeleton className="mb-6 h-11 w-full rounded-pillar" />
            <Skeleton className="mb-2 h-7 w-64" />
            <Skeleton className="mb-6 h-3 w-full" />
            <div className="mb-2 space-y-2">
              <Skeleton className="h-2.5 w-24" />
              <Skeleton className="h-14 w-full rounded-pillar" />
            </div>
            <Skeleton className="mb-6 h-2.5 w-40" />
            <Skeleton className="h-16 w-full rounded-pillar" />
          </div>

          <footer className="space-y-3 border-t border-outline-variant bg-surface-container-lowest p-6">
            <Skeleton className="h-14 w-full rounded-pillar" />
            <Skeleton className="h-12 w-full rounded-pillar" />
          </footer>
        </main>
      </div>
    </SkeletonPage>
  );
}
