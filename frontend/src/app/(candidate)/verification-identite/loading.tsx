import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function VerificationIdentiteLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-background pb-24 flex flex-col">
      <header className="sticky top-0 z-50 flex h-16 w-full items-center justify-between border-b border-surface-container-high bg-background px-4 lg:px-10">
        <Skeleton className="h-10 w-10 rounded-full" />
        <Skeleton className="h-4 w-48" />
        <span className="h-10 w-10" />
      </header>

      <main className="mx-auto flex flex-1 w-full max-w-md flex-col items-center px-4 pb-12 lg:max-w-lg lg:pb-16 lg:pt-6">
        <section className="w-full py-4 text-center">
          <Skeleton className="mx-auto h-4 w-full max-w-sm" />
        </section>

        <Skeleton className="aspect-[3/4] w-full max-w-md rounded-3xl lg:max-w-lg" />

        <div className="mt-6 flex w-full max-w-md flex-col gap-4 lg:max-w-lg">
          <Skeleton className="h-14 w-full rounded-pillar" />
          <Skeleton className="mx-auto h-2.5 w-3/4" />
        </div>
      </main>
    </SkeletonPage>
  );
}
