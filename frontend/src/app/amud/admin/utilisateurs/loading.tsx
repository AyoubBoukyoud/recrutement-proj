import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminUtilisateursLoading() {
  return (
    <SkeletonPage className="mx-auto w-full max-w-7xl">
      <div className="mb-xl space-y-2 border-l-4 border-amud-primary pl-4">
        <Skeleton tone="amud" className="h-7 w-56" />
        <Skeleton tone="amud" className="h-3 w-64" />
      </div>

      <div className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <Skeleton tone="amud" className="h-24 rounded-xl lg:col-span-2" />
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>

      <Skeleton tone="amud" className="mb-lg h-28 w-full rounded-xl" />

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-6 py-4">
          <Skeleton tone="amud" className="h-4 w-40" />
          <div className="flex gap-2">
            <Skeleton tone="amud" className="h-7 w-20 rounded-md" />
            <Skeleton tone="amud" className="h-7 w-20 rounded-md" />
          </div>
        </div>
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 px-6 py-4">
              <Skeleton tone="amud" className="h-5 w-5 rounded" />
              <Skeleton tone="amud" className="h-10 w-10 shrink-0 rounded-full" />
              <div className="min-w-[160px] space-y-1.5">
                <Skeleton tone="amud" className="h-3 w-28" />
                <Skeleton tone="amud" className="h-2.5 w-36" />
              </div>
              <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
              <Skeleton tone="amud" className="h-3 w-20" />
              <Skeleton tone="amud" className="h-3 w-16" />
              <Skeleton tone="amud" className="ml-auto h-3 w-24" />
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
