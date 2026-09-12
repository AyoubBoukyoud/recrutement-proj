/**
 * Aggrégations génériques (comptage par catégorie, top N, pourcentage) —
 * partagées par les modules `*Stats.ts` pour les bar/donut charts (villes,
 * statuts, niveaux, postes...) sans dupliquer le même `reduce` 6 fois.
 */

import type { Application } from '@/data/amud/applications';

export type Count = { label: string; value: number };

export function countBy<T>(items: T[], keyFn: (t: T) => string): Count[] {
  const counts = new Map<string, number>();
  for (const item of items) {
    const key = keyFn(item);
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries()).map(([label, value]) => ({ label, value }));
}

/** Les N catégories les plus fréquentes, triées décroissant. */
export function topN<T>(items: T[], keyFn: (t: T) => string, n = 8): Count[] {
  return countBy(items, keyFn)
    .sort((a, b) => b.value - a.value)
    .slice(0, n);
}

export function percentOf(part: number, total: number): number {
  return total > 0 ? Math.round((part / total) * 100) : 0;
}

export function sum<T>(items: T[], valueFn: (t: T) => number): number {
  return items.reduce((acc, item) => acc + valueFn(item), 0);
}

export function average<T>(items: T[], valueFn: (t: T) => number): number {
  return items.length > 0 ? sum(items, valueFn) / items.length : 0;
}

/**
 * Funnel cumulatif de recrutement (Candidatures → Présélection → Entretiens
 * → Finalistes → Recrutements) — combien de candidatures ont atteint au
 * moins ce stade. Partagé par `recruiterStats.ts` (candidatures d'une
 * entreprise) et `adminStats.ts` (candidatures de toute la plateforme) pour
 * ne garder qu'une seule définition du funnel.
 */
export function applicationsFunnel(applications: Application[]): Count[] {
  return [
    { label: 'Candidatures', value: applications.length },
    { label: 'Présélection', value: applications.filter((a) => ['SCREENING', 'INTERVIEW', 'SHORTLIST', 'ACCEPTED'].includes(a.status)).length },
    { label: 'Entretiens', value: applications.filter((a) => ['INTERVIEW', 'SHORTLIST', 'ACCEPTED'].includes(a.status)).length },
    { label: 'Finalistes', value: applications.filter((a) => ['SHORTLIST', 'ACCEPTED'].includes(a.status)).length },
    { label: 'Recrutements', value: applications.filter((a) => a.status === 'ACCEPTED').length },
  ];
}
