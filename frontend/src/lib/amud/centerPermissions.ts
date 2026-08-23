import type { CenterRole } from '@/data/amud/centerTypes';

/**
 * Matrice de permissions du workspace `/amud/centre/*` (cahier des charges
 * §49-50). `canPerform` doit être appelée à deux endroits : dans l'UI (pour
 * désactiver/masquer un bouton) ET à l'intérieur de chaque fonction de
 * mutation (pour bloquer réellement l'action si elle est appelée quand
 * même) — sinon ce ne serait qu'un habillage visuel, ce que le cahier des
 * charges interdit explicitement.
 *
 * ADMIN (console `/amud/admin`) et COMMERCIAL (`/amud/commercial`, lecture
 * seule) restent hors de cette matrice : ce sont des espaces séparés,
 * gérés par convention de route comme le reste du module `/amud` (pas
 * d'auth réelle) — cette matrice ne couvre que les rôles *à l'intérieur*
 * d'un même espace Centre.
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
  | 'view-financials';

const MATRIX: Record<CenterRole, CenterAction[]> = {
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

export function canPerform(role: CenterRole, action: CenterAction): boolean {
  return MATRIX[role]?.includes(action) ?? false;
}

export function actionsFor(role: CenterRole): CenterAction[] {
  return MATRIX[role] ?? [];
}

/** Libellé affiché quand une action est bloquée par la matrice (toast + message inline). */
export const PERMISSION_DENIED_MESSAGE = "Votre rôle actuel ne permet pas d'effectuer cette action.";
