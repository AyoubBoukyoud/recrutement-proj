import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="mb-lg flex items-end justify-between">
        <Skeleton tone="amud" className="h-8 w-40" />
        <Skeleton tone="amud" className="h-11 w-48 rounded-lg" />
      </div>
      <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-40 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
