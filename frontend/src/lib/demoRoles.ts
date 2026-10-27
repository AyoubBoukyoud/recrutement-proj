/** Presentation destinations only. These never grant API permissions. */
export const DEMO_ROLES = [
  { id: 'admin', label: 'Administrateur', icon: 'admin_panel_settings', path: '/amud/admin', description: 'Pilotage, utilisateurs et recrutement' },
  { id: 'employer', label: 'Recruteur', icon: 'domain', path: '/amud/entreprise/dashboard', description: 'Offres, candidatures et entretiens' },
  { id: 'candidate', label: 'Candidat', icon: 'person_search', path: '/amud/candidat', description: 'Profil, opportunités et candidatures' },
  { id: 'agent', label: 'Commercial', icon: 'handshake', path: '/amud/commercial', description: 'Contacts, objectifs et rendez-vous' },
  { id: 'centre', label: 'Centre de formation', icon: 'apartment', path: '/amud/centre/dashboard', description: 'Groupes, inscriptions et paiements' },
  { id: 'teacher', label: 'Enseignant', icon: 'cast_for_education', path: '/amud/teacher/dashboard', description: 'Cours, présences et rémunération' },
  { id: 'student', label: 'Étudiant', icon: 'school', path: '/amud/student/dashboard', description: 'Formation, planning et résultats' },
] as const;

export type DemoRole = (typeof DEMO_ROLES)[number];

export function demoRoleForPath(pathname: string): DemoRole | undefined {
  return DEMO_ROLES.find(({ path }) => {
    const root = path.replace(/\/dashboard$/, '');
    return pathname === root || pathname.startsWith(`${root}/`);
  });
}
