/**
 * Alertes admin partagées entre le tableau de bord (`/amud/admin`) et la
 * cloche du header (`AdminShell`) — un seul jeu de compteurs pour que les
 * deux affichages ne divergent jamais.
 */
export type AdminAlert = {
  id: string;
  label: string;
  count: number;
  href: string;
  dot: string;
};

export const ADMIN_ALERTS: AdminAlert[] = [
  { id: 'offres-attente', label: 'Offres en attente', count: 12, href: '/amud/admin/offres', dot: 'bg-amud-secondary' },
  { id: 'recruteurs-valider', label: 'Recruteurs à valider', count: 7, href: '/amud/admin/utilisateurs', dot: 'bg-amud-tertiary-container' },
];
