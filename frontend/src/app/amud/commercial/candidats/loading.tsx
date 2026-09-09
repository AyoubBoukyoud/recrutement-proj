import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialCandidatsLoading() {
  return (
    <SkeletonPage>
      <div className="mb-8 space-y-2">
        <Skeleton tone="amud" className="h-7 w-40" />
        <Skeleton tone="amud" className="h-3 w-72" />
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4 lg:grid-cols-7">
        {Array.from({ length: 7 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-6 h-16 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-4">
          <div className="flex gap-8">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton tone="amud" className="h-10 w-10 shrink-0 rounded-full" />
              <Skeleton tone="amud" className="h-3 w-32" />
              <Skeleton tone="amud" className="h-3 w-16" />
              <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
              <Skeleton tone="amud" className="ml-auto h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
