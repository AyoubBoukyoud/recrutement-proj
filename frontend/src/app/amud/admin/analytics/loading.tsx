import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-40" />
      <Skeleton tone="amud" className="mb-lg h-16 rounded-xl" />
      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>
      <div className="mb-lg grid grid-cols-1 gap-md sm:grid-cols-2">
        {Array.from({ length: 8 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-64 rounded-xl" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-md lg:grid-cols-2">
        <Skeleton tone="amud" className="h-56 rounded-xl" />
        <Skeleton tone="amud" className="h-56 rounded-xl" />
      </div>
    </SkeletonPage>
  );
}
