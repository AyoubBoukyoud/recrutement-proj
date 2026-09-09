import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function Loading() {
  return (
    <SkeletonPage>
      <Skeleton tone="amud" className="mb-md h-12 w-full max-w-sm" />
      <Skeleton tone="amud" className="h-[60vh] rounded-xl" />
    </SkeletonPage>
  );
}
