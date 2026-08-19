import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudEmployerDashboardLoading() {
  return (
    <SkeletonPage>
      <section className="space-y-2">
        <Skeleton tone="amud" className="h-7 w-56" />
        <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
      </section>

      <section className="grid grid-cols-1 gap-lg md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 rounded-xl" />
        ))}
      </section>

      <section className="space-y-md">
        <div className="flex items-center justify-between">
          <Skeleton tone="amud" className="h-5 w-40" />
          <Skeleton tone="amud" className="h-3 w-24" />
        </div>
        <div className="flex gap-lg overflow-x-auto pb-md">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-48 w-[280px] shrink-0 rounded-xl" />
          ))}
        </div>
      </section>

      <section className="overflow-hidden rounded-2xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-lg py-md">
          <Skeleton tone="amud" className="h-4 w-40" />
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 px-lg py-4">
              <div className="flex items-center gap-2">
                <Skeleton tone="amud" className="h-8 w-8 rounded-full" />
                <Skeleton tone="amud" className="h-3 w-28" />
              </div>
              <Skeleton tone="amud" className="h-3 w-32" />
              <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="ml-auto h-3 w-20" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
