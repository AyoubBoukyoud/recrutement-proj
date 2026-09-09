import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialNotificationsLoading() {
  return (
    <SkeletonPage>
      <div className="mb-lg flex items-end justify-between">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-40" />
          <Skeleton tone="amud" className="h-3 w-56" />
        </div>
        <Skeleton tone="amud" className="h-9 w-40 rounded-lg" />
      </div>

      <div className="mb-md flex gap-sm">
        {Array.from({ length: 6 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-8 w-20 rounded-full" />
        ))}
      </div>

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
        <div className="divide-y divide-amud-outline-variant">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="flex items-start gap-3 p-4">
              <Skeleton tone="amud" className="h-8 w-8 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton tone="amud" className="h-3 w-2/3" />
                <Skeleton tone="amud" className="h-2.5 w-1/3" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
