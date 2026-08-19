import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminCommercialProfileLoading() {
  return (
    <SkeletonPage className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-sm">
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <Skeleton tone="amud" className="h-24 w-24 rounded-full" />
            <div className="space-y-2">
              <Skeleton tone="amud" className="h-6 w-48" />
              <Skeleton tone="amud" className="h-4 w-36" />
              <Skeleton tone="amud" className="h-3 w-64" />
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-10 w-28 rounded-lg" />
            ))}
          </div>
        </div>
      </section>

      <div className="mb-lg flex gap-lg border-b border-amud-outline-variant px-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-4 w-20" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          <div className="grid grid-cols-2 gap-md md:grid-cols-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
            ))}
            <Skeleton tone="amud" className="col-span-2 h-24 rounded-xl md:col-span-2" />
          </div>
          <Skeleton tone="amud" className="h-64 w-full rounded-xl" />
        </div>
        <div className="flex flex-col gap-lg">
          <Skeleton tone="amud" className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
