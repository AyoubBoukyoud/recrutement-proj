import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialTachesLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl space-y-2">
        <Skeleton tone="amud" className="h-7 w-28" />
        <Skeleton tone="amud" className="h-3 w-72" />
      </div>

      <div className="mb-lg grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-16 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-lg h-16 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface">
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center justify-between gap-4 p-4">
              <div className="min-w-0 flex-1 space-y-1.5">
                <Skeleton tone="amud" className="h-3 w-52" />
                <Skeleton tone="amud" className="h-2.5 w-72" />
              </div>
              <Skeleton tone="amud" className="h-8 w-24 rounded-lg" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
