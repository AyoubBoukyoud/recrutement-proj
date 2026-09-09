import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-40" />
      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton tone="amud" className="h-56 rounded-xl" />
    </SkeletonPage>
  );
}
