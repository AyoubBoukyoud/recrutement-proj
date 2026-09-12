import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminOffresLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-56" />
          <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
        </div>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-xl h-40 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container p-4">
          <Skeleton tone="amud" className="h-3 w-24" />
          <Skeleton tone="amud" className="h-6 w-28 rounded" />
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton tone="amud" className="h-4 w-4 rounded" />
              <div className="min-w-[200px] flex-1 space-y-1.5">
                <Skeleton tone="amud" className="h-3 w-52" />
                <Skeleton tone="amud" className="h-2.5 w-36" />
              </div>
              <Skeleton tone="amud" className="h-3 w-20" />
              <Skeleton tone="amud" className="h-3 w-12" />
              <Skeleton tone="amud" className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
