/**
 * Journal d'audit réel du module `/amud/*`, alimenté par `lib/amud/storage/audit.ts`
 * (`logAudit(...)`) à chaque création/modification/suppression/changement de
 * statut important. Remplace le `SEED` inline en lecture seule de
 * `admin/journal-activite/page.tsx` — mêmes noms de champs pour que la page
 * n'ait qu'à changer sa source de données, pas son rendu.
 */
export type AuditRole = 'Admin' | 'Commercial' | 'Recruteur' | 'Candidat' | 'Centre' | 'N/A';
export type AuditResultat = 'Succès' | 'Échec';
export type AuditActionType = 'create' | 'update' | 'disable' | 'delete' | 'login_failed';

export type AuditLog = {
  id: string;
  date: string;
  heure: string;
  utilisateur: string;
  role: AuditRole;
  action: string;
  actionType: AuditActionType;
  module: string;
  reference: string;
  ip: string;
  localisation: string;
  resultat: AuditResultat;
  diff?: { before: string; after: string };
  /** Rattache une entrée à un centre de formation pour les vues scoping "Activité"/"Journal" du module Centres — absent pour toutes les entrées existantes des autres modules. */
  centerId?: string;
};

/** Quelques entrées de démarrage pour que le journal ne soit pas vide avant la première action réelle. */
export const auditLogSeed: AuditLog[] = [
  {
    id: 'log_seed1',
    date: '20/08/2026',
    heure: '09:12:00',
    utilisateur: 'Ahmed Benali',
    role: 'Commercial',
    action: 'Initialisation des données de démonstration',
    actionType: 'create',
    module: 'Système',
    reference: 'Amud Skills',
    ip: 'Session locale',
    localisation: 'Session locale',
    resultat: 'Succès',
  },
];
