import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-56" />
      <Skeleton tone="amud" className="mb-lg h-11 w-full max-w-md rounded-lg" />
      <div className="flex flex-col gap-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
