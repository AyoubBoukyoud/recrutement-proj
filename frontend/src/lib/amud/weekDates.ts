/**
 * Petits utilitaires de dates pour l'agenda commercial (`/amud/commercial/rendez-vous`).
 * Pas de lib externe (date-fns…) pour un module mock — juste ce qu'il faut
 * pour calculer une semaine (lundi-vendredi) réelle et la faire naviguer.
 */
const JOURS_COURTS = ['Dim', 'Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam'];
const MOIS_COURTS = ['jan', 'fév', 'mar', 'avr', 'mai', 'jun', 'jul', 'aoû', 'sep', 'oct', 'nov', 'déc'];
const MOIS_LONGS = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin', 'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

export function startOfDay(d: Date): Date {
  const out = new Date(d);
  out.setHours(0, 0, 0, 0);
  return out;
}

export function addDays(d: Date, n: number): Date {
  const out = new Date(d);
  out.setDate(out.getDate() + n);
  return out;
}

/** Lundi de la semaine de `d` (locale FR : la semaine commence un lundi). */
export function getMonday(d: Date): Date {
  const out = startOfDay(d);
  const day = out.getDay(); // 0 = dimanche
  const diff = day === 0 ? -6 : 1 - day;
  return addDays(out, diff);
}

export function isoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function sameDay(a: Date, b: Date): boolean {
  return isoDate(a) === isoDate(b);
}

export function dayLabel(d: Date): string {
  return JOURS_COURTS[d.getDay()];
}

/** "Mar 17 Oct" */
export function fullDayLabel(d: Date): string {
  return `${dayLabel(d)} ${d.getDate()} ${MOIS_COURTS[d.getMonth()]}`;
}

/** "17 - 21 octobre 2026" pour l'entête de la semaine (lundi → vendredi). */
export function weekLabel(monday: Date): string {
  const friday = addDays(monday, 4);
  const sameMonth = monday.getMonth() === friday.getMonth();
  const moisFriday = MOIS_LONGS[friday.getMonth()];
  if (sameMonth) return `${monday.getDate()} - ${friday.getDate()} ${moisFriday} ${friday.getFullYear()}`;
  return `${monday.getDate()} ${MOIS_LONGS[monday.getMonth()]} - ${friday.getDate()} ${moisFriday} ${friday.getFullYear()}`;
}

export function timeToMinutes(hhmm: string): number {
  const [h, m] = hhmm.split(':').map(Number);
  return h * 60 + m;
}

export function minutesToTime(total: number): string {
  const h = Math.floor(total / 60) % 24;
  const m = total % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
}
