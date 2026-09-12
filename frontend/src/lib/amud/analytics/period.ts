/**
 * Utilitaires de période partagés par tous les modules `*Stats.ts` du module
 * `/amud` — bucketing temporel, parsing des dates FR héritées des maquettes
 * (`dd/mm/yyyy`), et comparaison période courante / période précédente pour
 * les puces de tendance (+12.4% / -5.2%) des dashboards.
 */

export type PeriodKey = 'today' | '7d' | '30d' | '3m' | '6m' | 'year' | 'custom';

export type PeriodRange = { start: string; end: string }; // ISO yyyy-mm-dd, bornes incluses

export const PERIOD_OPTIONS: { value: PeriodKey; label: string }[] = [
  { value: 'today', label: "Aujourd'hui" },
  { value: '7d', label: '7 derniers jours' },
  { value: '30d', label: '30 derniers jours' },
  { value: '3m', label: '3 derniers mois' },
  { value: '6m', label: '6 derniers mois' },
  { value: 'year', label: 'Cette année' },
  { value: 'custom', label: 'Période personnalisée' },
];

export function toIsoDate(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Parse les dates `dd/mm/yyyy` héritées (ex. `Candidate.creeLe`, `Activite.date`). */
export function parseFrDate(s: string): Date | null {
  const m = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(s.trim());
  if (!m) return null;
  const [, dd, mm, yyyy] = m;
  const d = new Date(Number(yyyy), Number(mm) - 1, Number(dd));
  return Number.isNaN(d.getTime()) ? null : d;
}

/** Parse une date FR (`dd/mm/yyyy`) ou ISO (`Application.createdAt`...) indifféremment. */
export function parseAnyDate(s: string | Date): Date | null {
  if (s instanceof Date) return Number.isNaN(s.getTime()) ? null : s;
  const fr = parseFrDate(s);
  if (fr) return fr;
  const d = new Date(s);
  return Number.isNaN(d.getTime()) ? null : d;
}

function addDays(d: Date, delta: number): Date {
  const next = new Date(d);
  next.setDate(next.getDate() + delta);
  return next;
}

export function resolvePeriod(key: PeriodKey, custom?: PeriodRange, now: Date = new Date()): PeriodRange {
  const end = toIsoDate(now);
  if (key === 'custom') return custom ?? { start: toIsoDate(addDays(now, -29)), end };
  if (key === 'today') return { start: end, end };
  if (key === '7d') return { start: toIsoDate(addDays(now, -6)), end };
  if (key === '30d') return { start: toIsoDate(addDays(now, -29)), end };
  if (key === '3m') return { start: toIsoDate(addDays(now, -89)), end };
  if (key === '6m') return { start: toIsoDate(addDays(now, -179)), end };
  return { start: `${now.getFullYear()}-01-01`, end };
}

/** Fenêtre de même durée immédiatement précédente, pour la comparaison de période. */
export function previousPeriodRange(range: PeriodRange): PeriodRange {
  const start = new Date(range.start);
  const end = new Date(range.end);
  const days = Math.max(1, Math.round((end.getTime() - start.getTime()) / 86400000) + 1);
  const prevEnd = addDays(start, -1);
  const prevStart = addDays(prevEnd, -(days - 1));
  return { start: toIsoDate(prevStart), end: toIsoDate(prevEnd) };
}

export function inRange(date: string | Date, range: PeriodRange): boolean {
  const d = parseAnyDate(date);
  if (!d) return false;
  const iso = toIsoDate(d);
  return iso >= range.start && iso <= range.end;
}

export type TrendDirection = 'up' | 'down' | 'flat';
export type TrendTone = 'positive' | 'negative' | 'neutral';

export type TrendComparison = { deltaPct: number | null; direction: TrendDirection; tone: TrendTone };

/**
 * Compare deux valeurs de période et détermine le sens (haut/bas) ET la
 * tonalité (positif/négatif) — le sens "positif" dépend du KPI : plus de
 * recrutements = positif, plus d'impayés = négatif (`positiveIsGood: false`).
 */
export function comparePeriods(current: number, previous: number, opts: { positiveIsGood?: boolean } = {}): TrendComparison {
  const positiveIsGood = opts.positiveIsGood ?? true;
  if (previous === 0) {
    if (current === 0) return { deltaPct: null, direction: 'flat', tone: 'neutral' };
    return { deltaPct: null, direction: 'up', tone: positiveIsGood ? 'positive' : 'negative' };
  }
  const deltaPct = Math.round(((current - previous) / previous) * 1000) / 10;
  const direction: TrendDirection = deltaPct > 0 ? 'up' : deltaPct < 0 ? 'down' : 'flat';
  const tone: TrendTone = direction === 'flat' ? 'neutral' : (direction === 'up') === positiveIsGood ? 'positive' : 'negative';
  return { deltaPct, direction, tone };
}

const DAY_LABELS_MON_FIRST = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'];

/**
 * Bucket jour par jour sur toute la plage `range` (line/area charts courte
 * période). `valueFn` optionnel permet de sommer un champ numérique (ex.
 * revenus) plutôt que de simplement compter les occurrences (défaut).
 */
export function bucketByDay<T>(
  items: T[],
  getDate: (t: T) => string | Date | null | undefined,
  range: PeriodRange,
  valueFn: (t: T) => number = () => 1,
): { label: string; value: number }[] {
  const buckets = new Map<string, number>();
  let cursor = new Date(range.start);
  const endIso = range.end;
  while (toIsoDate(cursor) <= endIso) {
    buckets.set(toIsoDate(cursor), 0);
    cursor = addDays(cursor, 1);
  }
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = parseAnyDate(raw);
    if (!d) continue;
    const iso = toIsoDate(d);
    if (buckets.has(iso)) buckets.set(iso, (buckets.get(iso) ?? 0) + valueFn(item));
  }
  return Array.from(buckets.entries()).map(([iso, value]) => ({
    label: new Date(iso).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }),
    value,
  }));
}

/** Bucket par jour de semaine (Lun→Dim), toutes dates confondues dans `range` si fourni. */
export function bucketByWeekday<T>(
  items: T[],
  getDate: (t: T) => string | Date | null | undefined,
  range?: PeriodRange,
  valueFn: (t: T) => number = () => 1,
): { label: string; value: number }[] {
  const counts = [0, 0, 0, 0, 0, 0, 0]; // 0=Lun ... 6=Dim
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = parseAnyDate(raw);
    if (!d) continue;
    if (range && !inRange(d, range)) continue;
    const mondayFirst = (d.getDay() + 6) % 7;
    counts[mondayFirst] += valueFn(item);
  }
  return DAY_LABELS_MON_FIRST.map((label, i) => ({ label, value: counts[i] }));
}

/** Bucket par heure (0-23h), pour les champs `heure: "HH:MM"` (ex. AuditLog). */
export function bucketByHour<T>(items: T[], getHeure: (t: T) => string | null | undefined): { label: string; value: number }[] {
  const counts = new Array(24).fill(0);
  for (const item of items) {
    const raw = getHeure(item);
    if (!raw) continue;
    const h = parseInt(raw.split(':')[0], 10);
    if (!Number.isNaN(h) && h >= 0 && h < 24) counts[h] += 1;
  }
  return counts.map((value, h) => ({ label: `${String(h).padStart(2, '0')}h`, value }));
}

function startOfWeek(d: Date): Date {
  const day = (d.getDay() + 6) % 7; // lundi = 0
  return addDays(new Date(d.getFullYear(), d.getMonth(), d.getDate()), -day);
}

/** Bucket semaine par semaine (lundi→dimanche) sur toute la plage `range`. `valueFn` : voir `bucketByDay`. */
export function bucketByWeek<T>(
  items: T[],
  getDate: (t: T) => string | Date | null | undefined,
  range: PeriodRange,
  valueFn: (t: T) => number = () => 1,
): { label: string; value: number }[] {
  const buckets: { key: string; label: string }[] = [];
  let cursor = startOfWeek(new Date(range.start));
  const end = new Date(range.end);
  while (cursor <= end) {
    buckets.push({ key: toIsoDate(cursor), label: cursor.toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit' }) });
    cursor = addDays(cursor, 7);
  }
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = parseAnyDate(raw);
    if (!d) continue;
    const key = toIsoDate(startOfWeek(d));
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + valueFn(item));
  }
  return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

/** Bucket mois par mois sur toute la plage `range`. `valueFn` : voir `bucketByDay`. */
export function bucketByMonth<T>(
  items: T[],
  getDate: (t: T) => string | Date | null | undefined,
  range: PeriodRange,
  valueFn: (t: T) => number = () => 1,
): { label: string; value: number }[] {
  const buckets: { key: string; label: string }[] = [];
  let cursor = new Date(new Date(range.start).getFullYear(), new Date(range.start).getMonth(), 1);
  const end = new Date(range.end);
  while (cursor <= end) {
    buckets.push({ key: `${cursor.getFullYear()}-${String(cursor.getMonth() + 1).padStart(2, '0')}`, label: cursor.toLocaleDateString('fr-FR', { month: 'short', year: '2-digit' }) });
    cursor = new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1);
  }
  const counts = new Map(buckets.map((b) => [b.key, 0]));
  for (const item of items) {
    const raw = getDate(item);
    if (!raw) continue;
    const d = parseAnyDate(raw);
    if (!d) continue;
    const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    if (counts.has(key)) counts.set(key, (counts.get(key) ?? 0) + valueFn(item));
  }
  return buckets.map((b) => ({ label: b.label, value: counts.get(b.key) ?? 0 }));
}

/**
 * Bucketing de série temporelle qui choisit automatiquement la granularité
 * (jour/semaine/mois) selon la longueur de `range` — "évolution par
 * jour/semaine/mois selon la période sélectionnée" (cahier des charges §4).
 */
export function bucketTimeSeries<T>(
  items: T[],
  getDate: (t: T) => string | Date | null | undefined,
  range: PeriodRange,
  valueFn: (t: T) => number = () => 1,
): { label: string; value: number }[] {
  const days = Math.max(1, Math.round((new Date(range.end).getTime() - new Date(range.start).getTime()) / 86400000) + 1);
  if (days <= 31) return bucketByDay(items, getDate, range, valueFn);
  if (days <= 120) return bucketByWeek(items, getDate, range, valueFn);
  return bucketByMonth(items, getDate, range, valueFn);
}
