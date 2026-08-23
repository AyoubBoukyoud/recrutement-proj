import type { AppRole } from '@/data/amud/centerTypes';

/**
 * Matrice de permissions couvrant les 8 rôles du cahier des charges (§19) :
 * les 6 `CenterRole` internes à un centre (§49-50, simulés via le
 * sélecteur `useCurrentCenter`) PLUS `ADMIN` et `COMMERCIAL`, qui n'ont pas
 * de sélecteur — on sait qui ils sont par l'espace où l'on se trouve
 * (`/amud/admin/*`, `/amud/commercial/*`) — mais dont les actions passent
 * désormais par la même vérification `canPerform` que les autres, plutôt
 * que la seule convention de route.
 *
 * `canPerform` doit être appelée à deux endroits : dans l'UI (pour
 * désactiver/masquer un bouton) ET à l'intérieur de chaque fonction de
 * mutation (pour bloquer réellement l'action si elle est appelée quand
 * même) — sinon ce ne serait qu'un habillage visuel, ce que le cahier des
 * charges interdit explicitement.
 */
export type CenterAction =
  | 'manage-profile'
  | 'manage-students'
  | 'manage-teachers'
  | 'manage-formations'
  | 'manage-groups'
  | 'manage-schedule'
  | 'record-attendance'
  | 'manage-student-payments'
  | 'manage-teacher-payments'
  | 'manage-tarifs'
  | 'manage-site'
  | 'manage-leads'
  | 'view-financials'
  // Actions plateforme (Admin/Commercial), au-delà d'un seul centre.
  | 'manage-centers'
  | 'manage-partnership'
  | 'assign-commercial'
  | 'request-modification';

const MATRIX: Record<AppRole, CenterAction[]> = {
  // Accès complet, y compris aux actions plateforme qu'aucun rôle interne
  // à un centre ne possède (créer/supprimer un centre, changer le
  // partenariat, affecter un commercial).
  ADMIN: [
    'manage-profile',
    'manage-students',
    'manage-teachers',
    'manage-formations',
    'manage-groups',
    'manage-schedule',
    'record-attendance',
    'manage-student-payments',
    'manage-teacher-payments',
    'manage-tarifs',
    'manage-site',
    'manage-leads',
    'view-financials',
    'manage-centers',
    'manage-partnership',
    'assign-commercial',
  ],
  // Strictement lecture seule sur tout ce qui concerne les centres (cahier
  // des charges §COMMERCIAL) — sa seule action possible est de demander une
  // modification à l'Admin, jamais de modifier une donnée directement.
  COMMERCIAL: ['request-modification'],
  CENTER_OWNER: [
    'manage-profile',
    'manage-students',
    'manage-teachers',
    'manage-formations',
    'manage-groups',
    'manage-schedule',
    'record-attendance',
    'manage-student-payments',
    'manage-teacher-payments',
    'manage-tarifs',
    'manage-site',
    'manage-leads',
    'view-financials',
  ],
  CENTER_ADMIN: [
    'manage-profile',
    'manage-students',
    'manage-teachers',
    'manage-formations',
    'manage-groups',
    'manage-schedule',
    'record-attendance',
    'manage-student-payments',
    'manage-tarifs',
    'manage-site',
    'manage-leads',
    'view-financials',
  ],
  COORDINATOR: ['manage-students', 'manage-formations', 'manage-groups', 'manage-schedule', 'record-attendance', 'manage-leads'],
  TEACHER: ['record-attendance'],
  ACCOUNTANT: ['manage-student-payments', 'manage-teacher-payments', 'view-financials'],
  STUDENT: [],
};

export function canPerform(role: AppRole, action: CenterAction): boolean {
  return MATRIX[role]?.includes(action) ?? false;
}

export function actionsFor(role: AppRole): CenterAction[] {
  return MATRIX[role] ?? [];
}

/** Libellé affiché quand une action est bloquée par la matrice (toast + message inline). */
export const PERMISSION_DENIED_MESSAGE = "Votre rôle actuel ne permet pas d'effectuer cette action.";
