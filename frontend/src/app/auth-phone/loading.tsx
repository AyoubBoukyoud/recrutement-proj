import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

/** Même gabarit que le choix de méthode : colonne de marque (`lg`) ou bandeau, puis le formulaire. */
export default function AuthPhoneLoading() {
  return (
    <SkeletonPage className="min-h-[100dvh] bg-surface lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
      <Skeleton className="hidden rounded-none lg:block lg:h-[100dvh]" />
      <main className="flex min-h-[100dvh] flex-col">
        <Skeleton className="h-56 shrink-0 rounded-none lg:hidden" />
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 pt-6 lg:max-w-[440px] lg:justify-center lg:px-0 lg:py-24">
          <Skeleton className="mb-8 h-12 w-full rounded-pillar" />
          <Skeleton className="mb-3 h-8 w-72" />
          <Skeleton className="mb-1.5 h-3 w-full" />
          <Skeleton className="mb-8 h-3 w-3/4" />
          <Skeleton className="h-14 w-full rounded-pillar" />
          <Skeleton className="mx-auto my-6 h-2.5 w-8" />
          <Skeleton className="h-14 w-full rounded-pillar" />
        </div>
      </main>
    </SkeletonPage>
  );
}
