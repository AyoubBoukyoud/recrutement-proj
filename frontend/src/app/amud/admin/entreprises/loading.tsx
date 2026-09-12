import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminEntreprisesLoading() {
  return (
    <SkeletonPage>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-64" />
          <Skeleton tone="amud" className="h-3 w-56" />
        </div>
        <Skeleton tone="amud" className="h-11 w-52 rounded-lg" />
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-6 h-16 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 p-4">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 p-4">
              <Skeleton tone="amud" className="h-10 w-10 shrink-0 rounded" />
              <Skeleton tone="amud" className="h-3 w-32" />
              <Skeleton tone="amud" className="h-3 w-8" />
              <Skeleton tone="amud" className="h-3 w-8" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>

      <div className="mt-6 flex items-center justify-between">
        <Skeleton tone="amud" className="h-3 w-48" />
        <div className="flex gap-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-8 w-16 rounded-md" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
