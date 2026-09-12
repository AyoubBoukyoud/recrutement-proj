import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function VideoLoading() {
  return (
    <SkeletonPage>
      <header className="flex items-center gap-3 bg-primary p-2.5 pb-3 lg:px-4">
        <Skeleton className="h-5 w-5 rounded bg-white/30" />
        <Skeleton className="h-4 w-48 bg-white/30" />
      </header>

      <main className="mx-auto max-w-2xl space-y-5 p-6 lg:max-w-3xl lg:px-10 lg:py-8">
        <Skeleton className="h-3 w-full max-w-sm" />
        <Skeleton className="aspect-video w-full rounded-2xl" />
        <div className="flex justify-center">
          <Skeleton className="h-16 w-16 rounded-full" />
        </div>
      </main>
    </SkeletonPage>
  );
}
