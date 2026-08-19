import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCandidateDashboardLoading() {
  return (
    <SkeletonPage>
      <section className="space-y-2">
        <Skeleton tone="amud" className="h-7 w-56" />
        <Skeleton tone="amud" className="h-3.5 w-64" />
      </section>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3 lg:col-span-2">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-32 rounded-xl" />
          ))}
        </div>
        <Skeleton tone="amud" className="h-64 w-full rounded-xl" />
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-3">
        <div className="space-y-md lg:col-span-2">
          <Skeleton tone="amud" className="h-6 w-48" />
          <Skeleton tone="amud" className="h-40 w-full rounded-xl" />
          <Skeleton tone="amud" className="h-16 w-full rounded-xl" />
        </div>
        <div className="space-y-md lg:col-span-1">
          <Skeleton tone="amud" className="h-6 w-40" />
          {Array.from({ length: 2 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-52 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
