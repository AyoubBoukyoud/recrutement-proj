'use client';

import type { ReactNode } from 'react';
import { ChartHeader } from './ChartHeader';

/**
 * Conteneur carte pour un KPI/graphique — même carte que `StatCard`/
 * `ResponsiveTable` (`rounded-xl border bg-amud-surface-container-lowest
 * shadow-sm`), pour que les nouveaux blocs analytics s'intègrent visuellement
 * au reste du module plutôt que d'introduire un nouveau style.
 */
export function AnalyticsCard({
  title,
  subtitle,
  trailing,
  children,
  className = '',
}: {
  title?: string;
  subtitle?: string;
  trailing?: ReactNode;
  children: ReactNode;
  className?: string;
}) {
  return (
    <div className={`rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm ${className}`}>
      {title ? <ChartHeader title={title} subtitle={subtitle} trailing={trailing} /> : null}
      {children}
    </div>
  );
}
