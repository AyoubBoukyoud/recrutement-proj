import { Skeleton, SkeletonPage } from '@/components/shared/Skeleton';

export default function AdminCandidatsLoading() {
  return (
    <SkeletonPage className="rounded-card border border-outline-variant bg-surface-lowest p-6">
      <div className="mb-4 grid gap-1">
        <Skeleton className="h-2.5 w-16" />
        <Skeleton className="h-6 w-64" />
      </div>

      <div className="mb-4 grid gap-2 [grid-template-columns:minmax(160px,2fr)_minmax(140px,1fr)]">
        <Skeleton className="h-13 w-full rounded-element" />
        <Skeleton className="h-13 w-full rounded-element" />
      </div>

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[760px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant">
              {Array.from({ length: 6 }).map((_, i) => (
                <th key={i} className="pb-2 pr-3">
                  <Skeleton className="h-2.5 w-16" />
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {Array.from({ length: 6 }).map((_, i) => (
              <tr key={i}>
                <td className="py-3 pr-3">
                  <div className="flex items-center gap-3">
                    <Skeleton className="h-9 w-9 rounded-full" />
                    <div className="space-y-1.5">
                      <Skeleton className="h-3 w-28" />
                      <Skeleton className="h-2.5 w-20" />
                    </div>
                  </div>
                </td>
                <td className="py-3 pr-3">
                  <Skeleton className="h-1.5 w-24 rounded-full" />
                </td>
                <td className="py-3 pr-3">
                  <Skeleton className="h-5 w-10 rounded-full" />
                </td>
                <td className="py-3 pr-3">
                  <Skeleton className="h-5 w-16 rounded-full" />
                </td>
                <td className="py-3 pr-3">
                  <Skeleton className="h-5 w-20 rounded-full" />
                </td>
                <td className="py-3">
                  <div className="flex justify-end gap-2">
                    <Skeleton className="h-8 w-8 rounded-element" />
                    <Skeleton className="h-8 w-8 rounded-element" />
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-4 flex justify-end">
        <Skeleton className="h-9 w-40 rounded-element" />
      </div>
    </SkeletonPage>
  );
}
