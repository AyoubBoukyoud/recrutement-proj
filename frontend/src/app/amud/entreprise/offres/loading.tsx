import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="mb-lg flex items-end justify-between">
        <Skeleton tone="amud" className="h-8 w-56" />
        <Skeleton tone="amud" className="h-11 w-40 rounded-lg" />
      </div>
      <div className="mb-md flex gap-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-44 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
