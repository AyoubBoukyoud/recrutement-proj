import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminCandidaturesLoading() {
  return (
    <SkeletonPage className="flex h-[calc(100vh-96px)] flex-col md:h-[calc(100vh-160px)]">
      <header className="mb-md flex shrink-0 flex-col gap-md">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div className="space-y-2">
            <Skeleton tone="amud" className="h-7 w-64" />
            <Skeleton tone="amud" className="h-3 w-56" />
          </div>
          <Skeleton tone="amud" className="h-10 w-52 rounded-lg" />
        </div>
        <div className="grid grid-cols-2 gap-sm md:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-16 rounded-lg" />
          ))}
        </div>
        <Skeleton tone="amud" className="h-12 w-full rounded-lg" />
      </header>

      <div className="min-h-0 flex-1 overflow-x-auto rounded-lg bg-amud-surface-container-low">
        <div className="flex h-full w-max gap-md p-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="flex w-[85vw] shrink-0 flex-col rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest sm:w-80">
              <div className="border-b border-amud-outline-variant bg-amud-surface-container-high p-sm">
                <Skeleton tone="amud" className="h-4 w-24" />
              </div>
              <div className="flex flex-1 flex-col gap-sm p-sm">
                {Array.from({ length: 2 }).map((_, j) => (
                  <Skeleton key={j} tone="amud" className="h-24 w-full rounded-lg" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
