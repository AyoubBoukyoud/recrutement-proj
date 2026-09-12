import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialActivitesLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl space-y-2">
        <Skeleton tone="amud" className="h-7 w-32" />
        <Skeleton tone="amud" className="h-3 w-96" />
      </div>

      <div className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-lg h-24 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-4">
          <div className="flex gap-8">
            {Array.from({ length: 8 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton tone="amud" className="h-3 w-16" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
              <Skeleton tone="amud" className="ml-auto h-3 w-32" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
