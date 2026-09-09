'use client';

import type { ReactNode } from 'react';

/** En-tête titre + sous-titre + zone traînante (badge de période, toggle) d'une `AnalyticsCard`. */
export function ChartHeader({
  title,
  subtitle,
  trailing,
}: {
  title: string;
  subtitle?: string;
  trailing?: ReactNode;
}) {
  return (
    <div className="mb-md flex items-start justify-between gap-sm">
      <div className="min-w-0">
        <h3 className="text-title-lg text-amud-on-surface">{title}</h3>
        {subtitle ? <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{subtitle}</p> : null}
      </div>
      {trailing ? <div className="shrink-0">{trailing}</div> : null}
    </div>
  );
}
