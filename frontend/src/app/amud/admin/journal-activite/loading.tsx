import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminJournalActiviteLoading() {
  return (
    <SkeletonPage className="flex flex-col">
      <div className="mb-xl flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-56" />
          <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
        </div>
        <Skeleton tone="amud" className="h-10 w-40 rounded-lg" />
      </div>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface p-lg shadow-sm">
        <div className="mb-md grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
          <Skeleton tone="amud" className="h-10 rounded-lg lg:col-span-2" />
          <Skeleton tone="amud" className="h-10 rounded-lg" />
          <Skeleton tone="amud" className="h-10 rounded-lg" />
        </div>
        <div className="flex flex-wrap gap-md">
          <Skeleton tone="amud" className="h-6 w-56 rounded-full" />
          <Skeleton tone="amud" className="h-6 w-48 rounded-full" />
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-4">
          <div className="flex gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-2.5 w-16" />
            ))}
          </div>
        </div>
        <div>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-6 border-b border-amud-outline-variant p-4 last:border-0">
              <Skeleton tone="amud" className="h-8 w-20" />
              <Skeleton tone="amud" className="h-8 w-28" />
              <Skeleton tone="amud" className="h-8 w-32" />
              <Skeleton tone="amud" className="h-8 w-28" />
              <Skeleton tone="amud" className="h-3 w-24" />
              <Skeleton tone="amud" className="ml-auto h-5 w-16 rounded-full" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
