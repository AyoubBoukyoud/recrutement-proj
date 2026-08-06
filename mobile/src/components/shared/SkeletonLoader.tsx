'use client';

import { usePageLoading } from '@/hooks/usePageLoading';

/* ─── Primitive bone ─── */

interface BoneProps {
  className?: string;
  style?: React.CSSProperties;
}

/** Single shimmer block — building unit for all skeletons. */
export function Bone({ className = '', style }: BoneProps) {
  return <div className={`skeleton-bone ${className}`} style={style} aria-hidden />;
}

/* ─── Basic variants ─── */

export type SkeletonVariant = 'text' | 'card' | 'avatar' | 'list' | 'kpi' | 'table-row' | 'chip';

interface SkeletonLoaderProps {
  variant?: SkeletonVariant;
  count?: number;
  className?: string;
}

export function SkeletonLoader({ variant = 'text', count = 1, className = '' }: SkeletonLoaderProps) {
  const items = Array.from({ length: count });

  if (variant === 'card') {
    return (
      <div className={`space-y-3 ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <div
            key={i}
            className="overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest p-4 shadow-sm"
          >
            <div className="flex gap-3">
              <Bone className="h-16 w-16 shrink-0 rounded-lg" />
              <div className="flex-1 space-y-2 pt-1">
                <Bone className="h-3.5 w-2/3 rounded" />
                <Bone className="h-3 w-1/2 rounded" />
                <div className="flex gap-2 pt-1">
                  <Bone className="h-5 w-14 rounded-full" />
                  <Bone className="h-5 w-16 rounded-full" />
                </div>
              </div>
            </div>
          </div>
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (variant === 'avatar') {
    return (
      <div className={`flex gap-3 ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <Bone key={i} className="h-12 w-12 rounded-full" />
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (variant === 'list') {
    return (
      <div className={`space-y-2.5 ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <div
            key={i}
            className="flex items-center gap-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-3"
          >
            <Bone className="h-10 w-10 shrink-0 rounded-lg" />
            <div className="flex-1 space-y-1.5">
              <Bone className="h-3 w-2/3 rounded" />
              <Bone className="h-2.5 w-1/3 rounded" />
            </div>
            <Bone className="h-6 w-6 shrink-0 rounded-full" />
          </div>
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (variant === 'kpi') {
    return (
      <div className={`grid grid-cols-2 gap-3 lg:grid-cols-4 ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <div
            key={i}
            className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-4 shadow-sm"
          >
            <div className="flex items-start justify-between">
              <Bone className="h-8 w-8 rounded-lg" />
              <Bone className="h-4 w-10 rounded" />
            </div>
            <Bone className="mt-4 h-7 w-16 rounded" />
            <Bone className="mt-2 h-3 w-24 rounded" />
          </div>
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (variant === 'table-row') {
    return (
      <div className={`space-y-0 divide-y divide-outline-variant/40 overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-3.5">
            <Bone className="h-8 w-8 shrink-0 rounded-full" />
            <Bone className="h-3 w-28 rounded" />
            <Bone className="hidden h-3 w-24 rounded sm:block" />
            <Bone className="ml-auto h-6 w-16 rounded-full" />
          </div>
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  if (variant === 'chip') {
    return (
      <div className={`flex flex-wrap gap-2 ${className}`} role="status" aria-label="Chargement">
        {items.map((_, i) => (
          <Bone key={i} className="h-8 w-20 rounded-full" />
        ))}
        <span className="sr-only">Chargement…</span>
      </div>
    );
  }

  // text (default)
  return (
    <div className={`space-y-2 ${className}`} role="status" aria-label="Chargement">
      {items.map((_, i) => (
        <Bone
          key={i}
          className={`h-3 rounded ${i === items.length - 1 && items.length > 1 ? 'w-3/5' : 'w-full'}`}
        />
      ))}
      <span className="sr-only">Chargement…</span>
    </div>
  );
}

/* ─── Full-page layout skeletons ─── */

export type PageSkeletonLayout =
  | 'dashboard'
  | 'list'
  | 'cards'
  | 'form'
  | 'table'
  | 'profile'
  | 'detail'
  | 'kanban'
  | 'chat'
  | 'stats'
  | 'settings'
  | 'media'
  | 'simple';

interface PageSkeletonProps {
  layout?: PageSkeletonLayout;
  className?: string;
  /** Extra top padding for pages without sticky header in skeleton */
  withHeader?: boolean;
}

export function PageSkeleton({ layout = 'list', className = '', withHeader = true }: PageSkeletonProps) {
  return (
    <div
      className={`animate-in fade-in duration-300 ${className}`}
      role="status"
      aria-busy="true"
      aria-label="Chargement de la page"
    >
      {withHeader && layout !== 'simple' && <HeaderSkeleton />}
      <div className="px-4 pb-8 pt-4 sm:px-6">
        {layout === 'dashboard' && <DashboardSkeleton />}
        {layout === 'list' && <ListPageSkeleton />}
        {layout === 'cards' && <CardsSkeleton />}
        {layout === 'form' && <FormSkeleton />}
        {layout === 'table' && <TableSkeleton />}
        {layout === 'profile' && <ProfileSkeleton />}
        {layout === 'detail' && <DetailSkeleton />}
        {layout === 'kanban' && <KanbanSkeleton />}
        {layout === 'chat' && <ChatSkeleton />}
        {layout === 'stats' && <StatsSkeleton />}
        {layout === 'settings' && <SettingsSkeleton />}
        {layout === 'media' && <MediaSkeleton />}
        {layout === 'simple' && <SimpleSkeleton />}
      </div>
      <span className="sr-only">Chargement de la page…</span>
    </div>
  );
}

function HeaderSkeleton() {
  return (
    <div className="sticky top-0 z-10 flex h-14 items-center justify-between border-b border-outline-variant/30 bg-surface-lowest/90 px-4 backdrop-blur-md sm:px-6">
      <div className="space-y-1.5">
        <Bone className="h-4 w-36 rounded" />
        <Bone className="h-2.5 w-20 rounded" />
      </div>
      <div className="flex items-center gap-2">
        <Bone className="h-9 w-9 rounded-full" />
        <Bone className="h-9 w-9 rounded-full" />
      </div>
    </div>
  );
}

function DashboardSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-6">
      {/* Progress circle area */}
      <div className="flex flex-col items-center rounded-xl border border-outline-variant/40 bg-surface-lowest p-6 shadow-sm">
        <div className="mb-4 flex w-full items-center justify-between">
          <Bone className="h-4 w-32 rounded" />
          <Bone className="h-4 w-10 rounded" />
        </div>
        <Bone className="mb-4 h-36 w-36 rounded-full" />
        <Bone className="h-3 w-3/4 max-w-xs rounded" />
      </div>

      <div className="flex justify-center">
        <Bone className="h-9 w-48 rounded-full" />
      </div>

      <div className="space-y-3">
        <Bone className="h-5 w-40 rounded" />
        <SkeletonLoader variant="list" count={4} />
      </div>

      <div className="space-y-3">
        <Bone className="h-5 w-32 rounded" />
        <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-4">
              <Bone className="mb-3 h-8 w-8 rounded-lg" />
              <Bone className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

function ListPageSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-4">
      <div className="space-y-2">
        <Bone className="h-7 w-48 rounded" />
        <Bone className="h-3 w-64 rounded" />
      </div>
      <Bone className="h-11 w-full rounded-xl" />
      <SkeletonLoader variant="chip" count={4} />
      <SkeletonLoader variant="card" count={4} />
    </div>
  );
}

function CardsSkeleton() {
  return (
    <div className="mx-auto max-w-4xl space-y-4">
      <div className="space-y-2">
        <Bone className="h-7 w-44 rounded" />
        <Bone className="h-3 w-56 rounded" />
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-5 shadow-sm">
            <Bone className="mb-4 h-11 w-11 rounded-xl" />
            <Bone className="mb-2 h-4 w-3/4 rounded" />
            <Bone className="h-3 w-full rounded" />
            <Bone className="mt-1 h-3 w-2/3 rounded" />
          </div>
        ))}
      </div>
    </div>
  );
}

function FormSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="space-y-2">
        <Bone className="h-7 w-52 rounded" />
        <Bone className="h-3 w-full rounded" />
      </div>
      {Array.from({ length: 4 }).map((_, i) => (
        <div key={i} className="space-y-2">
          <Bone className="h-3 w-24 rounded" />
          <Bone className="h-11 w-full rounded-xl" />
        </div>
      ))}
      <Bone className="h-12 w-full rounded-xl" />
    </div>
  );
}

function TableSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-4">
      <div className="space-y-2">
        <Bone className="h-7 w-48 rounded" />
        <Bone className="h-3 w-64 rounded" />
      </div>
      <div className="flex flex-col gap-2 sm:flex-row">
        <Bone className="h-11 flex-1 rounded-xl" />
        <div className="flex gap-2">
          <Bone className="h-11 w-24 rounded-xl" />
          <Bone className="h-11 w-24 rounded-xl" />
        </div>
      </div>
      <SkeletonLoader variant="table-row" count={6} />
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="mx-auto max-w-md space-y-5">
      <div className="flex flex-col items-center rounded-xl border border-outline-variant/40 bg-surface-lowest p-6 shadow-sm">
        <Bone className="mb-4 h-24 w-24 rounded-full" />
        <Bone className="mb-2 h-5 w-40 rounded" />
        <Bone className="mb-3 h-3 w-28 rounded" />
        <div className="flex gap-2">
          <Bone className="h-7 w-16 rounded-full" />
          <Bone className="h-7 w-20 rounded-full" />
        </div>
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-lowest p-4">
          <Bone className="h-4 w-32 rounded" />
          <Bone className="h-3 w-full rounded" />
          <Bone className="h-3 w-4/5 rounded" />
          <Bone className="h-3 w-3/5 rounded" />
        </div>
      ))}
    </div>
  );
}

function DetailSkeleton() {
  return (
    <div className="mx-auto max-w-3xl space-y-5">
      <div className="flex items-start gap-4 rounded-xl border border-outline-variant/40 bg-surface-lowest p-5 shadow-sm">
        <Bone className="h-20 w-20 shrink-0 rounded-xl" />
        <div className="flex-1 space-y-2 pt-1">
          <Bone className="h-5 w-48 rounded" />
          <Bone className="h-3 w-32 rounded" />
          <div className="flex gap-2 pt-1">
            <Bone className="h-6 w-14 rounded-full" />
            <Bone className="h-6 w-16 rounded-full" />
            <Bone className="h-6 w-12 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-3 sm:grid-cols-3">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-4">
            <Bone className="mb-2 h-3 w-16 rounded" />
            <Bone className="h-5 w-20 rounded" />
          </div>
        ))}
      </div>
      <div className="space-y-3 rounded-xl border border-outline-variant/40 bg-surface-lowest p-5">
        <Bone className="h-4 w-28 rounded" />
        <Bone className="h-3 w-full rounded" />
        <Bone className="h-3 w-full rounded" />
        <Bone className="h-3 w-2/3 rounded" />
      </div>
      <div className="flex gap-3">
        <Bone className="h-12 flex-1 rounded-xl" />
        <Bone className="h-12 flex-1 rounded-xl" />
      </div>
    </div>
  );
}

function KanbanSkeleton() {
  return (
    <div className="mx-auto max-w-6xl space-y-4">
      <Bone className="h-7 w-48 rounded" />
      <div className="grid gap-4 overflow-x-auto md:grid-cols-4">
        {Array.from({ length: 4 }).map((_, col) => (
          <div key={col} className="min-w-[220px] space-y-2.5 rounded-2xl bg-surface-container p-3">
            <div className="mb-2 flex items-center justify-between px-1">
              <Bone className="h-3 w-20 rounded" />
              <Bone className="h-5 w-6 rounded-full" />
            </div>
            {Array.from({ length: 2 + (col % 2) }).map((_, i) => (
              <div key={i} className="rounded-xl bg-surface-lowest p-3 shadow-sm">
                <div className="mb-2 flex items-center gap-2">
                  <Bone className="h-8 w-8 rounded-full" />
                  <Bone className="h-3 w-24 rounded" />
                </div>
                <Bone className="h-2.5 w-full rounded" />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

function ChatSkeleton() {
  return (
    <div className="mx-auto flex h-[70vh] max-w-5xl overflow-hidden rounded-xl border border-outline-variant/40 bg-surface-lowest">
      {/* Conversation list */}
      <div className="hidden w-80 shrink-0 flex-col border-r border-outline-variant/40 sm:flex">
        <div className="border-b border-outline-variant/40 p-4">
          <Bone className="h-10 w-full rounded-xl" />
        </div>
        <div className="flex-1 space-y-1 p-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="flex items-center gap-3 rounded-lg p-3">
              <Bone className="h-10 w-10 shrink-0 rounded-full" />
              <div className="flex-1 space-y-1.5">
                <Bone className="h-3 w-28 rounded" />
                <Bone className="h-2.5 w-full rounded" />
              </div>
            </div>
          ))}
        </div>
      </div>
      {/* Thread */}
      <div className="flex flex-1 flex-col">
        <div className="flex items-center gap-3 border-b border-outline-variant/40 p-4">
          <Bone className="h-10 w-10 rounded-full" />
          <Bone className="h-4 w-32 rounded" />
        </div>
        <div className="flex flex-1 flex-col gap-3 p-4">
          <Bone className="h-10 w-3/5 self-start rounded-2xl" />
          <Bone className="h-10 w-2/5 self-end rounded-2xl" />
          <Bone className="h-14 w-3/4 self-start rounded-2xl" />
          <Bone className="h-10 w-1/2 self-end rounded-2xl" />
        </div>
        <div className="border-t border-outline-variant/40 p-3">
          <Bone className="h-11 w-full rounded-xl" />
        </div>
      </div>
    </div>
  );
}

function StatsSkeleton() {
  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div className="flex items-center justify-between">
        <Bone className="h-8 w-48 rounded" />
        <Bone className="h-9 w-24 rounded-xl" />
      </div>
      <SkeletonLoader variant="chip" count={4} />
      <SkeletonLoader variant="kpi" count={4} />
      <div className="grid gap-4 md:grid-cols-2">
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className="rounded-xl border border-outline-variant/40 bg-surface-lowest p-5 shadow-sm">
            <Bone className="mb-4 h-4 w-36 rounded" />
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, j) => (
                <div key={j} className="flex items-center gap-3">
                  <Bone className="h-3 w-16 rounded" />
                  <Bone className="h-3 flex-1 rounded-full" />
                  <Bone className="h-3 w-8 rounded" />
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div className="flex items-center gap-4">
        <Bone className="h-10 w-10 rounded-full" />
        <Bone className="h-7 w-40 rounded" />
      </div>
      {Array.from({ length: 3 }).map((_, i) => (
        <div key={i} className="space-y-4 rounded-card border border-outline-variant/40 bg-surface-lowest p-6 shadow-sm">
          <div className="flex items-center gap-3">
            <Bone className="h-5 w-5 rounded" />
            <Bone className="h-4 w-32 rounded" />
          </div>
          <div className="flex gap-2">
            <Bone className="h-10 flex-1 rounded-xl" />
            <Bone className="h-10 flex-1 rounded-xl" />
            <Bone className="h-10 flex-1 rounded-xl" />
          </div>
        </div>
      ))}
    </div>
  );
}

function MediaSkeleton() {
  return (
    <div className="mx-auto max-w-lg space-y-5">
      <div className="space-y-2">
        <Bone className="h-7 w-48 rounded" />
        <Bone className="h-3 w-full rounded" />
      </div>
      <Bone className="aspect-video w-full rounded-2xl" />
      <div className="flex justify-center gap-4">
        <Bone className="h-14 w-14 rounded-full" />
        <Bone className="h-14 w-14 rounded-full" />
        <Bone className="h-14 w-14 rounded-full" />
      </div>
      <div className="space-y-2 rounded-xl border border-outline-variant/40 bg-surface-lowest p-4">
        <Bone className="h-3 w-full rounded" />
        <Bone className="h-3 w-4/5 rounded" />
      </div>
    </div>
  );
}

function SimpleSkeleton() {
  return (
    <div className="mx-auto flex min-h-[50vh] max-w-xs flex-col items-center justify-center space-y-4 py-16">
      <Bone className="h-14 w-14 rounded-2xl" />
      <SkeletonLoader variant="text" count={3} className="w-full" />
    </div>
  );
}

/* ─── Convenience wrapper ─── */

interface WithPageSkeletonProps {
  layout?: PageSkeletonLayout;
  delayMs?: number;
  className?: string;
  withHeader?: boolean;
  children: React.ReactNode;
}

/**
 * Shows a page skeleton for `delayMs`, then renders children.
 * Ideal for mock-data screens; swap for real loading flags later.
 */
export function WithPageSkeleton({
  layout = 'list',
  delayMs = 0,
  className,
  withHeader,
  children,
}: WithPageSkeletonProps) {
  const isLoading = usePageLoading(delayMs);

  if (isLoading) {
    return <PageSkeleton layout={layout} className={className} withHeader={withHeader} />;
  }

  return <>{children}</>;
}
