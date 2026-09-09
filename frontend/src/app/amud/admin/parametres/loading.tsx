import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminParametresLoading() {
  return (
    <SkeletonPage className="mx-auto max-w-[1200px] space-y-xl pb-24">
      <div className="space-y-2">
        <Skeleton tone="amud" className="h-7 w-56" />
        <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
      </div>

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="border-b border-amud-outline-variant p-lg">
          <Skeleton tone="amud" className="h-5 w-52" />
        </div>
        <div className="grid grid-cols-1 gap-lg p-lg lg:grid-cols-2">
          {Array.from({ length: 2 }).map((_, col) => (
            <div key={col} className="space-y-md">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="space-y-1">
                  <Skeleton tone="amud" className="h-2.5 w-32" />
                  <Skeleton tone="amud" className="h-10 w-full rounded-lg" />
                </div>
              ))}
            </div>
          ))}
        </div>
      </section>

      <div className="grid grid-cols-1 gap-xl xl:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <section key={i} className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-lg">
              <Skeleton tone="amud" className="h-4 w-48" />
            </div>
            <div className="space-y-md p-lg">
              <Skeleton tone="amud" className="h-16 w-full rounded-lg" />
              <Skeleton tone="amud" className="h-10 w-full rounded-lg" />
            </div>
          </section>
        ))}
      </div>

      <section className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-bright p-lg">
          <Skeleton tone="amud" className="h-4 w-48" />
          <Skeleton tone="amud" className="h-7 w-14 rounded-full" />
        </div>
        <div className="grid grid-cols-1 gap-lg p-lg md:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-28 rounded-lg" />
          ))}
        </div>
      </section>
    </SkeletonPage>
  );
}
