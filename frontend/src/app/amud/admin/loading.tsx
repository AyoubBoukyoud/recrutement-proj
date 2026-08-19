import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminDashboardLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-64" />
          <Skeleton tone="amud" className="h-3.5 w-72" />
        </div>
        <div className="flex gap-sm">
          <Skeleton tone="amud" className="h-10 w-40 rounded-lg" />
          <Skeleton tone="amud" className="h-10 w-36 rounded-lg" />
        </div>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-lg lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 w-full rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="space-y-xl lg:col-span-2">
          <Skeleton tone="amud" className="h-80 w-full rounded-xl" />
        </div>
        <div className="space-y-xl lg:col-span-1">
          <Skeleton tone="amud" className="h-56 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
