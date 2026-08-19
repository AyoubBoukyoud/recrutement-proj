import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminObjectifsLoading() {
  return (
    <SkeletonPage>
      <div className="mb-lg space-y-2">
        <Skeleton tone="amud" className="h-7 w-64" />
        <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
      </div>

      <div className="mb-xl grid grid-cols-2 gap-md md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 rounded-xl" />
        ))}
      </div>

      <section className="mb-xl rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="mb-md flex items-center justify-between">
          <Skeleton tone="amud" className="h-4 w-64" />
          <div className="flex gap-sm">
            <Skeleton tone="amud" className="h-9 w-32 rounded-lg" />
            <Skeleton tone="amud" className="h-9 w-28 rounded-lg" />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-md md:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-16 rounded-lg" />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-xl border border-amud-surface-container-high bg-amud-surface-container-lowest shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 p-4">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <div className="flex items-center gap-2">
                <Skeleton tone="amud" className="h-8 w-8 rounded-full" />
                <Skeleton tone="amud" className="h-3 w-24" />
              </div>
              <Skeleton tone="amud" className="h-3 w-8" />
              <Skeleton tone="amud" className="h-3 w-8" />
              <Skeleton tone="amud" className="h-3 w-8" />
              <Skeleton tone="amud" className="h-2 w-40 rounded-full" />
              <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
