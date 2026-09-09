import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-48" />
      <div className="flex flex-col gap-lg">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-48 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
