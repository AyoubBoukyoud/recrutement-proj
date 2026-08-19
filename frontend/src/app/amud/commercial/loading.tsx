import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialDashboardLoading() {
  return (
    <SkeletonPage>
      <header className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-end">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-56" />
          <Skeleton tone="amud" className="h-3 w-64" />
        </div>
        <Skeleton tone="amud" className="h-10 w-28 rounded-lg" />
      </header>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-12">
        <div className="space-y-gutter lg:col-span-8">
          <Skeleton tone="amud" className="h-44 w-full rounded-xl" />
          <div className="grid grid-cols-2 gap-md md:grid-cols-3">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-24 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-2 gap-md md:grid-cols-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-20 rounded-lg" />
            ))}
          </div>
        </div>

        <div className="space-y-gutter lg:col-span-4">
          <Skeleton tone="amud" className="h-56 w-full rounded-xl" />
          <Skeleton tone="amud" className="h-48 w-full rounded-xl" />
        </div>
      </div>
    </SkeletonPage>
  );
}
