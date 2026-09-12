import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialPerformanceLoading() {
  return (
    <SkeletonPage>
      <div className="mb-8 space-y-2">
        <Skeleton tone="amud" className="h-7 w-40" />
        <Skeleton tone="amud" className="h-3 w-72" />
      </div>

      <Skeleton tone="amud" className="mb-lg h-16 w-full rounded-xl" />
      <Skeleton tone="amud" className="mb-lg h-40 w-full rounded-xl" />

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>

      <div className="grid grid-cols-1 gap-lg lg:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-72 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
