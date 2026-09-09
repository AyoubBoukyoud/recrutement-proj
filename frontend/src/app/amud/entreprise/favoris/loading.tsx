import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-40" />
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-36 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
