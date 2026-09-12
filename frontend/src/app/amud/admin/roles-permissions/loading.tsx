import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AmudAdminRolesPermissionsLoading() {
  return (
    <SkeletonPage className="mx-auto flex w-full max-w-[1200px] flex-col gap-xl">
      <div className="flex flex-col justify-between gap-md border-b border-amud-outline-variant pb-md md:flex-row md:items-end">
        <div className="space-y-2">
          <Skeleton tone="amud" className="h-7 w-56" />
          <Skeleton tone="amud" className="h-3 w-full max-w-lg" />
        </div>
        <div className="flex gap-sm">
          <Skeleton tone="amud" className="h-10 w-32 rounded-lg" />
          <Skeleton tone="amud" className="h-10 w-32 rounded-lg" />
          <Skeleton tone="amud" className="h-10 w-28 rounded-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-4">
        <div className="flex flex-col gap-md lg:col-span-1">
          <Skeleton tone="amud" className="h-4 w-40" />
          <div className="flex flex-col gap-xs rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-sm shadow-sm">
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} tone="amud" className="h-14 w-full rounded-md" />
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-lg lg:col-span-3">
          <Skeleton tone="amud" className="h-24 w-full rounded-lg" />
          <div className="overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <div className="border-b border-amud-outline-variant bg-amud-surface-container-low p-md">
              <Skeleton tone="amud" className="h-4 w-48" />
            </div>
            <div className="divide-y divide-amud-outline-variant">
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="flex items-center gap-6 p-4">
                  <Skeleton tone="amud" className="h-3 w-24" />
                  {Array.from({ length: 6 }).map((_, j) => (
                    <Skeleton key={j} tone="amud" className="h-5 w-9 rounded-full" />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </SkeletonPage>
  );
}
