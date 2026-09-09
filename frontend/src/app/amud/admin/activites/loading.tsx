import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminActivitesLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-64" />
          <Skeleton tone="amud" className="h-3.5 w-72" />
        </div>
        <Skeleton tone="amud" className="h-10 w-44 rounded-lg" />
      </div>

      <section className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Skeleton tone="amud" className="col-span-2 h-32 rounded-xl md:col-span-4 lg:col-span-2" />
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-32 rounded-xl" />
        ))}
      </section>

      <Skeleton tone="amud" className="mb-xl h-16 w-full rounded-xl" />

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-4">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton tone="amud" className="h-8 w-16" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="h-3 w-28" />
              <Skeleton tone="amud" className="h-3 w-20" />
              <Skeleton tone="amud" className="h-5 w-16 rounded-full" />
              <Skeleton tone="amud" className="h-3 flex-1" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
