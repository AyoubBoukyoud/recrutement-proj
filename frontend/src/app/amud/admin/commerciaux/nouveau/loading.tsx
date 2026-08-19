import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminNouveauCommercialLoading() {
  return (
    <SkeletonPage className="mx-auto max-w-4xl space-y-lg pb-32">
      <div className="space-y-2">
        <Skeleton tone="amud" className="h-3 w-32" />
        <Skeleton tone="amud" className="h-7 w-64" />
        <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
      </div>

      <section className="relative overflow-hidden rounded-2xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-sm">
        <Skeleton tone="amud" className="mb-md h-4 w-24" />
        <div className="flex flex-col gap-lg md:flex-row">
          <div className="flex w-full flex-col items-center gap-4 md:w-1/4">
            <Skeleton tone="amud" className="h-32 w-32 rounded-full" />
          </div>
          <div className="grid w-full grid-cols-1 gap-md md:w-3/4 md:grid-cols-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="space-y-1">
                <Skeleton tone="amud" className="h-2.5 w-20" />
                <Skeleton tone="amud" className="h-10 w-full rounded-lg" />
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="relative overflow-hidden rounded-2xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-sm">
        <Skeleton tone="amud" className="mb-md h-4 w-56" />
        <div className="grid grid-cols-1 gap-md md:grid-cols-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="space-y-1">
              <Skeleton tone="amud" className="h-2.5 w-24" />
              <Skeleton tone="amud" className="h-10 w-full rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
