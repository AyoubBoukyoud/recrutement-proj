import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminCommerciauxLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div className="space-y-2 pl-4">
          <Skeleton tone="amud" className="h-7 w-48" />
          <Skeleton tone="amud" className="h-3 w-64" />
        </div>
        <Skeleton tone="amud" className="h-11 w-56 rounded-lg" />
      </div>

      <div className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-6 h-16 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container p-4">
          <div className="flex gap-6">
            {Array.from({ length: 5 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-20" />
            ))}
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant/50">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 p-4">
              <Skeleton tone="amud" className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-[160px] space-y-1.5">
                <Skeleton tone="amud" className="h-3 w-28" />
                <Skeleton tone="amud" className="h-2.5 w-20" />
              </div>
              <Skeleton tone="amud" className="h-5 w-16 rounded-full" />
              <Skeleton tone="amud" className="h-3 w-16" />
              <Skeleton tone="amud" className="hidden h-2 w-48 rounded-full lg:block" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
