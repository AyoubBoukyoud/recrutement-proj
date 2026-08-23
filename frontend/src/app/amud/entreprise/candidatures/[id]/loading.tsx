import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-24 rounded-xl" />
      <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
        <div className="flex flex-col gap-lg lg:col-span-2">
          <Skeleton tone="amud" className="h-40 rounded-xl" />
          <Skeleton tone="amud" className="h-32 rounded-xl" />
        </div>
        <Skeleton tone="amud" className="h-56 rounded-xl" />
      </div>
    </SkeletonPage>
  );
}
