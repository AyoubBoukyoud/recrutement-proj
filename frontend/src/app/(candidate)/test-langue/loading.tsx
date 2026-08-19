import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function TestLangueLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 max-w-4xl items-center justify-between px-6 mx-auto w-full lg:px-10">
        <Skeleton className="h-6 w-6 rounded" />
        <Skeleton className="h-4 w-56" />
        <span className="w-6" />
      </header>

      <main className="mx-auto max-w-2xl px-6 pb-8 pt-4 lg:max-w-4xl lg:px-10">
        <section className="flex flex-col items-center text-center">
          <Skeleton className="mb-6 h-32 w-32 rounded-full" />
          <Skeleton className="mb-1 h-6 w-64" />
          <Skeleton className="mx-auto mb-6 h-3 w-full max-w-md" />
          <Skeleton className="mb-8 h-24 w-full rounded-xl" />
          <Skeleton className="h-12 w-48 rounded-full" />
        </section>
      </main>
    </SkeletonPage>
  );
}
