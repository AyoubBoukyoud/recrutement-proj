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

export default function AmudMarketingHomeLoading() {
  return (
    <SkeletonPage className="min-h-screen overflow-x-hidden bg-amud-background">
      <MarketingNavSkeleton />

      <header className="bg-amud-surface-container-low py-24 md:py-32">
        <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
          <div className="grid items-center gap-12 md:grid-cols-2">
            <div className="space-y-6">
              <Skeleton tone="amud" className="h-16 w-full max-w-lg" />
              <Skeleton tone="amud" className="h-20 w-full max-w-xl" />
              <div className="flex gap-4 pt-4">
                <Skeleton tone="amud" className="h-12 w-44 rounded-lg" />
                <Skeleton tone="amud" className="h-12 w-44 rounded-lg" />
              </div>
            </div>
            <Skeleton tone="amud" className="h-[400px] w-full rounded-lg" />
          </div>
        </div>
      </header>

      <div className="border-b border-amud-surface-dim bg-amud-surface-container-highest py-6">
        <div className="mx-auto flex max-w-container-max flex-wrap items-center justify-center gap-8 px-margin-mobile md:justify-between md:px-gutter">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-10 w-44" />
          ))}
        </div>
      </div>

      <main className="space-y-section-gap bg-amud-background py-section-gap">
        <section className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
          <Skeleton tone="amud" className="h-64 w-full rounded-lg" />
        </section>

        <section className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
          <div className="mb-12 flex flex-col items-center gap-2">
            <Skeleton tone="amud" className="h-6 w-64" />
            <Skeleton tone="amud" className="h-3 w-72" />
          </div>
          <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
            <Skeleton tone="amud" className="h-64 rounded-lg md:col-span-2" />
            <Skeleton tone="amud" className="h-64 rounded-lg" />
            <Skeleton tone="amud" className="h-64 rounded-lg" />
            <Skeleton tone="amud" className="h-64 rounded-lg md:col-span-2" />
          </div>
        </section>

        <section className="border-y border-amud-surface-dim bg-amud-surface-container-low py-20">
          <div className="mx-auto max-w-container-max px-margin-mobile md:px-gutter">
            <div className="mb-12 max-w-2xl space-y-2">
              <Skeleton tone="amud" className="h-6 w-72" />
              <Skeleton tone="amud" className="h-10 w-full" />
            </div>
            <div className="flex flex-col gap-8 md:flex-row">
              {Array.from({ length: 3 }).map((_, i) => (
                <Skeleton key={i} tone="amud" className="h-40 flex-1 rounded-lg" />
              ))}
            </div>
          </div>
        </section>
      </main>

      <MarketingFooterSkeleton />
    </SkeletonPage>
  );
}
