import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-lg h-28 rounded-xl" />
      <Skeleton tone="amud" className="mb-lg h-40 rounded-xl" />
      <Skeleton tone="amud" className="h-72 rounded-xl" />
    </SkeletonPage>
  );
}
