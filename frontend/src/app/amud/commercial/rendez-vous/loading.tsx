import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudCommercialRendezVousLoading() {
  return (
    <SkeletonPage>
      <div className="mb-xl flex flex-col items-start justify-between gap-4 md:flex-row md:items-center">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-6 w-52" />
          <Skeleton tone="amud" className="h-3 w-64" />
        </div>
        <Skeleton tone="amud" className="h-9 w-72 rounded-lg" />
      </div>

      <div className="flex gap-lg">
        <div className="flex-1 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface">
          <div className="flex items-center justify-between border-b border-amud-outline-variant p-md">
            <Skeleton tone="amud" className="h-5 w-32" />
            <Skeleton tone="amud" className="h-6 w-24" />
          </div>
          <div className="grid grid-cols-6 gap-px bg-amud-outline-variant p-px">
            {Array.from({ length: 6 * 6 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-12 rounded-none" />
            ))}
          </div>
        </div>

        <div className="sticky top-24 hidden h-[calc(100vh-8rem)] w-80 flex-col rounded-xl border border-amud-outline-variant bg-amud-surface xl:flex">
          <div className="space-y-3 border-b border-amud-outline-variant p-lg">
            <Skeleton tone="amud" className="h-5 w-20 rounded-full" />
            <Skeleton tone="amud" className="h-5 w-40" />
            <Skeleton tone="amud" className="h-3 w-32" />
          </div>
          <div className="flex-1 space-y-4 p-lg">
            <Skeleton tone="amud" className="h-10 w-full" />
            <Skeleton tone="amud" className="h-10 w-full" />
            <Skeleton tone="amud" className="h-20 w-full rounded-lg" />
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
