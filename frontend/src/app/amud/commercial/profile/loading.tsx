import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialProfileLoading() {
  return (
    <SkeletonPage>
      <div className="mb-8 space-y-2">
        <Skeleton tone="amud" className="h-7 w-40" />
        <Skeleton tone="amud" className="h-3 w-72" />
      </div>

      <div className="mb-lg flex items-center gap-lg rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
        <Skeleton tone="amud" className="h-16 w-16 shrink-0 rounded-full" />
        <div className="flex-1 space-y-2">
          <Skeleton tone="amud" className="h-5 w-48" />
          <Skeleton tone="amud" className="h-3 w-32" />
        </div>
      </div>

      <div className="mb-lg flex gap-lg border-b border-amud-outline-variant px-sm pb-2">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-4 w-20" />
        ))}
      </div>

      <Skeleton tone="amud" className="h-64 w-full rounded-xl" />
    </SkeletonPage>
  );
}
