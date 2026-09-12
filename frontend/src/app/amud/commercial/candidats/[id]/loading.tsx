import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialCandidatDetailLoading() {
  return (
    <SkeletonPage>
      <div className="mx-auto max-w-[1200px]">
        <div className="mb-lg rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          <div className="flex items-start gap-lg">
            <Skeleton tone="amud" className="h-16 w-16 shrink-0 rounded-full" />
            <div className="flex-1 space-y-2">
              <Skeleton tone="amud" className="h-6 w-64" />
              <Skeleton tone="amud" className="h-3 w-48" />
              <Skeleton tone="amud" className="h-3 w-72" />
            </div>
          </div>
        </div>

        <div className="mb-lg flex gap-lg border-b border-amud-outline-variant px-sm pb-2">
          {Array.from({ length: 8 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-4 w-20" />
          ))}
        </div>

        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <Skeleton key={i} tone="amud" className="h-20 rounded-xl" />
              ))}
            </div>
            <Skeleton tone="amud" className="h-64 w-full rounded-xl" />
          </div>
          <div className="flex flex-col gap-lg">
            <Skeleton tone="amud" className="h-40 w-full rounded-xl" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
