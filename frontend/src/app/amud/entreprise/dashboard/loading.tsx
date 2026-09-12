import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudEntrepriseDashboardLoading() {
  return (
    <SkeletonPage>
      <section className="space-y-2">
        <Skeleton tone="amud" className="h-7 w-56" />
        <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
      </section>

      <section className="grid grid-cols-1 gap-lg pt-lg md:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-28 rounded-xl" />
        ))}
      </section>

      <section className="grid grid-cols-1 gap-md pt-lg sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-16 rounded-xl" />
        ))}
      </section>

      <section className="space-y-sm pt-lg">
        {Array.from({ length: 3 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
        ))}
      </section>
    </SkeletonPage>
  );
}
