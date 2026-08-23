import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-48" />
      <div className="mb-md flex gap-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-8 w-20 rounded-full" />
        ))}
      </div>
      <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-amud-outline-variant">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-16 rounded-none" />
        ))}
      </div>
    </SkeletonPage>
  );
}
