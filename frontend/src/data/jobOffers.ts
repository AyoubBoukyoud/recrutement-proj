/**
 * Catalogue d'offres du prototype candidat + favoris/candidatures persistés.
 *
 * Il n'existe pas d'API Laravel équivalente aujourd'hui (`/offres` était une
 * maquette Stitch statique) : ce module n'a donc qu'une seule implémentation,
 * toujours localStorage, contrairement aux dépôts `candidateProfile`/`documents`
 * qui basculent vers l'API réelle hors maquette.
 */
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';

export type BadgeType = 'secondary' | 'tertiary' | 'neutral' | 'urgent';

export interface JobOffer {
  id: string;
  title: string;
  company: string;
  companyIcon: string;
  logo: string;
  location: string;
  salary: string;
  /** Une des valeurs de `FILTERS` sur /offres — sert au filtre par secteur. */
  sector: string;
  badges: { text: string; type: BadgeType }[];
  /** Score de correspondance affiché sur les recommandations du dashboard. */
  match: number;
}

export const JOB_OFFERS: JobOffer[] = [
  {
    id: 'klinik-berlin',
    title: 'Infirmier Qualifié',
    company: 'Klinik Berlin',
    companyIcon: 'domain',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC65RZFkMIBKkDR_PCnqKHbnzk61gQRYHCw7Z5yMbyZwLKvMFDlzm_lCJRW5RZWCnY0Ftj-odI4LZGUntAM__NVLIP73ra80OXakvbyi0szbEaksiRxkcN7krxhPSeymAfNct5jAq_ZZXEUPo_0_jj-ObpOYrf0EhNXRudem0hZXkV4JAYovH62hJ0smPz2iPwrzLj67SF4ADw3IXop13sBXA-OvOovGiaALwYHlRfXnCffbcayNDgO',
    location: 'Berlin, Allemagne',
    salary: '3 200€ - 3 800€ / mois',
    sector: 'Santé',
    badges: [
      { text: 'B1 requis', type: 'secondary' },
      { text: 'Plein temps', type: 'neutral' },
    ],
    match: 90,
  },
  {
    id: 'hotel-munchen',
    title: 'Réceptionniste',
    company: 'Hôtel München',
    companyIcon: 'hotel',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBlK-c7eR7aVuA_zB0GwvOMQRcj0YxsFFcn6W4X8TY048VMvaVGP9JQE48FgpTXsygtKauIDLEGNCtoaMcdD-_v5AwZUWrCULMtjwy-hBPBT-J_wAGpWOjRnOaJpAVgM7LkIx8oD4glmmZeZiP2vMBGCD5WiZ2Ka1be6wUJA3n3PwsdDFDvE5XpolUw15GpyPXf_lJYoWMAPpX3ynilz7UKqVh6vZ_3gwU3VRhffijwOrwOY_VRrvAb',
    location: 'Munich, Allemagne',
    salary: '2 400€ - 2 900€ / mois',
    sector: 'Hôtellerie',
    badges: [
      { text: 'B2 recommandé', type: 'tertiary' },
      { text: 'CDI', type: 'neutral' },
    ],
    match: 92,
  },
  {
    id: 'elektro-gmbh',
    title: 'Électricien de Bâtiment',
    company: 'Elektro Gmbh',
    companyIcon: 'bolt',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBEKk99eeOD6vMgi8ElDVzQmQEyKR8BsZG7jJ2hXuQHjATwxNTbnfz_K2BUB7s42Q5HYlKSnB91UZEOCwNgzHghGzGsu9PRFZtv9aroDTaVytPI8HIQzL5nIlPmzCP_2VGXXPwNami5_7RfkZlMkXBjc6I0hIruAeHfiZn_GhTPbHsuLHMfndjwi88-s80B5vBE8Al4qVVq51Bfpy9ourTj5wNOSx8O9zL_nT2SrZ-8QBieChDqtgEc',
    location: 'Hamburg, Allemagne',
    salary: '3 000€ - 3 500€ / mois',
    sector: 'Électricité',
    badges: [
      { text: 'B1 requis', type: 'secondary' },
      { text: 'Déplacement', type: 'neutral' },
    ],
    match: 84,
  },
  {
    id: 'logistik-nord',
    title: 'Chauffeur PL',
    company: 'Logistik Nord',
    companyIcon: 'local_shipping',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB5Ynm3VoRzox7o4i61rcTC40ekLq52XJnr5_lMIZafa3q_1VJywVQip2XkGJjoqhNRThO4rIDPChxdU-Hf4MBuwMaNPEcoLBr2_JwKx0fuBrYRpxGMgHEcELgrPt1i70J0krQ5UTuLpoDnmqhg5V2TbTQPdGdsfVfXyUelt4kqW2KTjry_LU5VFtxaEjne3bITKC0p1Nf7LJDjIaBruyO3P7fZBPXIRGC0NL_3sv8ij9F8WfSdRpiL',
    location: 'Frankfurt, Allemagne',
    salary: '2 800€ - 3 200€ / mois',
    sector: 'Logistique',
    badges: [
      { text: 'A2 suffisant', type: 'neutral' },
      { text: 'Urgent', type: 'urgent' },
    ],
    match: 78,
  },
  {
    id: 'pflegeheim-hamburg',
    title: 'Aide-Soignant',
    company: 'Pflegeheim Hamburg',
    companyIcon: 'medical_services',
    logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuC65RZFkMIBKkDR_PCnqKHbnzk61gQRYHCw7Z5yMbyZwLKvMFDlzm_lCJRW5RZWCnY0Ftj-odI4LZGUntAM__NVLIP73ra80OXakvbyi0szbEaksiRxkcN7krxhPSeymAfNct5jAq_ZZXEUPo_0_jj-ObpOYrf0EhNXRudem0hZXkV4JAYovH62hJ0smPz2iPwrzLj67SF4ADw3IXop13sBXA-OvOovGiaALwYHlRfXnCffbcayNDgO',
    location: 'Hamburg, Allemagne',
    salary: '2 600€ - 3 000€ / mois',
    sector: 'Santé',
    badges: [
      { text: 'A2 suffisant', type: 'neutral' },
      { text: 'CDI', type: 'neutral' },
    ],
    match: 87,
  },
];

/* ------------------------------------------------------------------ *
 * Favoris — `as_job_favorites`.
 * ------------------------------------------------------------------ */

export function listFavoriteIds(): string[] {
  return readStorage<string[]>(STORAGE_KEYS.jobFavorites, []);
}

export function toggleFavorite(id: string): string[] {
  const current = listFavoriteIds();
  const next = current.includes(id) ? current.filter((x) => x !== id) : [...current, id];
  writeStorage(STORAGE_KEYS.jobFavorites, next);
  return next;
}

/* ------------------------------------------------------------------ *
 * Candidatures — `as_job_applications`.
 * ------------------------------------------------------------------ */

export interface JobApplication {
  jobId: string;
  appliedAt: string;
}

/** Le pipeline "Suivi des candidatures" du dashboard suppose ces trois
 *  candidatures déjà en cours — les semer ici évite que /offres propose de
 *  postuler une seconde fois à des offres déjà dans le pipeline. */
function seedApplications(): JobApplication[] {
  return [
    { jobId: 'klinik-berlin', appliedAt: '2026-08-15T09:00:00.000Z' },
    { jobId: 'elektro-gmbh', appliedAt: '2026-08-20T09:00:00.000Z' },
    { jobId: 'logistik-nord', appliedAt: '2026-08-24T09:00:00.000Z' },
  ];
}

export function listApplications(): JobApplication[] {
  return readStorage<JobApplication[]>(STORAGE_KEYS.jobApplications, seedApplications());
}

export function listAppliedIds(): string[] {
  return listApplications().map((a) => a.jobId);
}

export function applyToJob(id: string): JobApplication[] {
  const current = listApplications();
  if (current.some((a) => a.jobId === id)) return current;
  const next = [...current, { jobId: id, appliedAt: new Date().toISOString() }];
  writeStorage(STORAGE_KEYS.jobApplications, next);
  return next;
}
