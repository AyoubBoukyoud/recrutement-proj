import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-72" />
      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-24 rounded-xl" />
        ))}
      </div>
      <Skeleton tone="amud" className="mb-lg h-48 rounded-xl" />
      <Skeleton tone="amud" className="h-64 rounded-xl" />
    </SkeletonPage>
  );
}
