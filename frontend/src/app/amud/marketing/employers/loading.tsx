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

export default function AmudMarketingEmployersLoading() {
  return (
    <SkeletonPage className="min-h-screen overflow-x-hidden bg-amud-background">
      <MarketingNavSkeleton />

      <main>
        <section className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <Skeleton tone="amud" className="h-16 w-full max-w-lg" />
              <Skeleton tone="amud" className="h-20 w-full max-w-xl" />
              <div className="flex gap-4">
                <Skeleton tone="amud" className="h-12 w-36 rounded" />
                <Skeleton tone="amud" className="h-12 w-36 rounded" />
              </div>
            </div>
            <Skeleton tone="amud" className="h-[400px] w-full rounded-xl" />
          </div>
        </section>

        <section className="border-y border-amud-primary/10 bg-amud-surface-container-lowest py-section-gap">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="mb-12 flex flex-col items-center gap-2">
              <Skeleton tone="amud" className="h-6 w-56" />
              <Skeleton tone="amud" className="h-3 w-96" />
            </div>
            <div className="grid gap-6 md:grid-cols-3">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} tone="amud" className="h-40 rounded-lg" />
              ))}
            </div>
          </div>
        </section>

        <section className="mx-auto max-w-container-max px-margin-mobile py-section-gap md:px-gutter">
          <div className="grid items-center gap-16 md:grid-cols-2">
            <div className="space-y-6">
              <Skeleton tone="amud" className="h-6 w-64" />
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className="flex gap-4">
                  <Skeleton tone="amud" className="h-12 w-12 shrink-0 rounded-full" />
                  <div className="flex-1 space-y-2">
                    <Skeleton tone="amud" className="h-4 w-48" />
                    <Skeleton tone="amud" className="h-10 w-full" />
                  </div>
                </div>
              ))}
            </div>
            <Skeleton tone="amud" className="h-80 w-full rounded-xl" />
          </div>
        </section>
      </main>

      <MarketingFooterSkeleton />
    </SkeletonPage>
  );
}
