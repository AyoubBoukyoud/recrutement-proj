import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudHubLoading() {
  return (
    <SkeletonPage className="flex min-h-screen flex-col items-center bg-amud-background px-6 py-16">
      <div className="mb-12 flex flex-col items-center gap-3">
        <Skeleton tone="amud" className="h-16 w-16 rounded-2xl" />
        <Skeleton tone="amud" className="h-6 w-40" />
        <Skeleton tone="amud" className="h-3 w-64" />
      </div>

      <div className="grid w-full max-w-4xl grid-cols-1 gap-lg sm:grid-cols-2">
        {Array.from({ length: 4 }).map((_, i) => (
          <Skeleton key={i} tone="amud" className="h-40 w-full rounded-xl" />
        ))}
      </div>

      <div className="mt-16 w-full max-w-4xl">
        <Skeleton tone="amud" className="mx-auto mb-4 h-5 w-56" />
        <div className="grid grid-cols-1 gap-lg sm:grid-cols-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} tone="amud" className="h-32 w-full rounded-xl" />
          ))}
        </div>
      </div>
    </SkeletonPage>
  );
}
