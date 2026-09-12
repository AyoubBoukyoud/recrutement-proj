import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <div className="mb-lg flex items-end justify-between">
        <Skeleton tone="amud" className="h-8 w-48" />
        <Skeleton tone="amud" className="h-11 w-48 rounded-lg" />
      </div>
      <div className="mb-md flex gap-sm">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-8 w-24 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-sm">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
        ))}
      </div>
    </SkeletonPage>
  );
}
