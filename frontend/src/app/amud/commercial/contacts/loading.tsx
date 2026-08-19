import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialContactsLoading() {
  return (
    <SkeletonPage>
      <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-40" />
          <Skeleton tone="amud" className="h-3 w-64" />
        </div>
        <Skeleton tone="amud" className="h-10 w-44 rounded-lg" />
      </div>

      <div className="flex flex-col gap-6">
        <div className="flex gap-6 border-b border-amud-outline-variant pb-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-4 w-24" />
          ))}
        </div>

        <Skeleton tone="amud" className="h-16 w-full rounded-lg" />

        <div className="hidden overflow-hidden rounded-lg border border-l-4 border-amud-outline-variant border-l-amud-primary bg-amud-surface-container-lowest lg:block">
          <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-4">
            <div className="flex gap-8">
              {Array.from({ length: 6 }).map((_, i) => (
                <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
              ))}
            </div>
          </div>
          <div className="divide-y divide-amud-outline-variant">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="flex items-center gap-6 p-4">
                <Skeleton tone="amud" className="h-10 w-10 shrink-0 rounded-full" />
                <div className="min-w-[140px] space-y-1.5">
                  <Skeleton tone="amud" className="h-3 w-28" />
                  <Skeleton tone="amud" className="h-2.5 w-20" />
                </div>
                <Skeleton tone="amud" className="h-3 w-24" />
                <Skeleton tone="amud" className="h-3 w-16" />
                <Skeleton tone="amud" className="h-5 w-24 rounded-full" />
                <Skeleton tone="amud" className="h-6 w-6 rounded-full" />
              </div>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-3 lg:hidden">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-40 w-full rounded-lg" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
