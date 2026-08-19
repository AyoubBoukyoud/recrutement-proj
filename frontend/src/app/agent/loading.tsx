import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AgentLoading() {
  return (
    <SkeletonPage className="min-h-screen bg-surface">
      <header className="flex flex-wrap items-center justify-between gap-4 border-b border-outline-variant bg-surface-lowest px-8 py-4">
        <div className="flex items-center gap-2">
          <Skeleton className="h-6 w-6 rounded" />
          <div className="space-y-1.5">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-2.5 w-20" />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 text-right">
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-2.5 w-16" />
          </div>
          <Skeleton className="h-9 w-28 rounded-element" />
        </div>
      </header>

      <main className="mx-auto grid max-w-[520px] gap-6 px-6 py-8">
        <div className="rounded-card border border-outline-variant bg-surface-lowest p-6">
          <div className="mb-4 grid gap-1">
            <Skeleton className="h-2.5 w-20" />
            <Skeleton className="h-5 w-56" />
            <Skeleton className="h-3 w-full" />
          </div>
          <Skeleton className="mx-auto h-60 w-60 rounded-element" />
          <div className="mt-4 flex justify-center">
            <Skeleton className="h-3 w-48" />
          </div>
          <div className="mt-4 flex flex-wrap justify-center gap-2">
            <Skeleton className="h-9 w-32 rounded-element" />
            <Skeleton className="h-9 w-24 rounded-element" />
            <Skeleton className="h-9 w-28 rounded-element" />
          </div>
        </div>

        <div className="rounded-card border border-outline-variant bg-surface-lowest p-6">
          <div className="mb-4 grid gap-1">
            <Skeleton className="h-2.5 w-14" />
            <Skeleton className="h-5 w-48" />
          </div>
          <div className="grid gap-4 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="space-y-1.5 rounded-element border border-outline-variant p-4">
                <Skeleton className="h-2.5 w-12" />
                <Skeleton className="h-5 w-20" />
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-card border border-outline-variant bg-surface-lowest p-6">
          <div className="mb-4 grid gap-1">
            <Skeleton className="h-2.5 w-24" />
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-3 w-full" />
          </div>
          <div className="grid gap-2">
            {Array.from({ length: 3 }).map((_, i) => (
              <div key={i} className="flex flex-wrap items-center gap-2 border-t border-outline-variant pt-2">
                <div className="min-w-[160px] flex-1 space-y-1">
                  <Skeleton className="h-3 w-40" />
                  <Skeleton className="h-2.5 w-32" />
                </div>
                <Skeleton className="h-5 w-24 rounded-full" />
                <Skeleton className="h-3 w-12" />
              </div>
            ))}
          </div>
        </div>
      </main>
    </SkeletonPage>
  );
}
