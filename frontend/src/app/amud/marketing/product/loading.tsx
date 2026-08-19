import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

function MarketingNavSkeleton() {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-amud-primary/10 bg-amud-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-gutter">
        <Skeleton tone="amud" className="h-5 w-28" />
        <div className="hidden items-center gap-8 md:flex">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-3 w-16" />
          ))}
        </div>
        <div className="flex items-center gap-4">
          <Skeleton tone="amud" className="h-4 w-16" />
          <Skeleton tone="amud" className="h-10 w-20 rounded-lg" />
        </div>
      </div>
    </nav>
  );
}

function MarketingFooterSkeleton() {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-base border-t-4 border-amud-primary bg-amud-surface-container-highest px-margin-mobile py-section-gap md:flex-row md:px-gutter">
      <div className="flex flex-col items-center gap-2 md:items-start">
        <Skeleton tone="amud" className="h-5 w-28" />
        <Skeleton tone="amud" className="h-3 w-56" />
      </div>
      <div className="mt-6 flex flex-wrap justify-center gap-6 md:mt-0">
        {Array.from({ length: 5 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-3 w-16" />
        ))}
      </div>
    </footer>
  );
}

export default function AmudMarketingProductLoading() {
  return (
    <SkeletonPage className="min-h-screen overflow-x-hidden bg-amud-background">
      <MarketingNavSkeleton />

      <main>
        <section className="pb-32 pt-24">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="grid grid-cols-1 items-center gap-12 lg:grid-cols-2">
              <div className="space-y-6">
                <Skeleton tone="amud" className="h-8 w-52 rounded-full" />
                <Skeleton tone="amud" className="h-20 w-full max-w-lg" />
                <Skeleton tone="amud" className="h-16 w-full max-w-md" />
                <div className="flex gap-4 pt-4">
                  <Skeleton tone="amud" className="h-14 w-40 rounded" />
                  <Skeleton tone="amud" className="h-14 w-44 rounded" />
                </div>
              </div>
              <Skeleton tone="amud" className="h-[500px] w-full max-w-md justify-self-center rounded-3xl" />
            </div>
          </div>
        </section>

        <section className="bg-amud-surface-container-low py-section-gap">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="mx-auto mb-16 max-w-2xl space-y-2 text-center">
              <Skeleton tone="amud" className="mx-auto h-6 w-64" />
              <Skeleton tone="amud" className="h-10 w-full" />
            </div>
            <div className="grid auto-rows-[minmax(200px,auto)] grid-cols-1 gap-6 md:grid-cols-3">
              <Skeleton tone="amud" className="rounded-xl md:col-span-2" />
              <Skeleton tone="amud" className="rounded-xl" />
              <Skeleton tone="amud" className="rounded-xl" />
              <Skeleton tone="amud" className="rounded-xl md:col-span-2" />
            </div>
          </div>
        </section>
      </main>

      <MarketingFooterSkeleton />
    </SkeletonPage>
  );
}
