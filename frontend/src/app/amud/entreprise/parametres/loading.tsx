import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-40" />
      <div className="flex flex-col gap-lg">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-32 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
