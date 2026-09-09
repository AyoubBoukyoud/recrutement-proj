import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-8 w-40" />
      <div className="flex flex-col gap-0 overflow-hidden rounded-xl border border-amud-outline-variant">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-none" />
        ))}
      </div>
    </SkeletonPage>
  );
}
