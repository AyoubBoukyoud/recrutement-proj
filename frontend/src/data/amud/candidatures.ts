/**
 * Jeu de données factice du pipeline de candidatures (`/amud/admin/candidatures`),
 * extrait de la page pour pouvoir être réutilisé par la recherche globale du
 * header (`AdminShell`) sans dupliquer le seed.
 */
export type ColonneId = 'nouvelle' | 'preselection' | 'entretien' | 'shortlist';

export type Candidat = {
  id: string;
  nom: string;
  poste: string;
  tags: string[];
  score: number;
  date: string;
  depuis: string;
  initiales: string;
};

export const COLONNES: { id: ColonneId; label: string; dot: string }[] = [
  { id: 'nouvelle', label: 'Nouvelle', dot: 'bg-amud-surface-tint' },
  { id: 'preselection', label: 'Présélection', dot: 'bg-amud-secondary-container' },
  { id: 'entretien', label: 'Entretien', dot: 'bg-amud-tertiary-fixed-dim' },
  { id: 'shortlist', label: 'Shortlist', dot: 'bg-amud-primary-fixed-dim' },
];

export const candidaturesSeed: Record<ColonneId, Candidat[]> = {
  nouvelle: [
    { id: 'c1', nom: 'Sophie Martin', poste: 'Infirmier D.E.', tags: ['Soins Intensifs', 'Bloc Opératoire'], score: 95, date: '12/10/2023', depuis: 'Il y a 2h', initiales: 'SM' },
    { id: 'c2', nom: 'Lucas Moreau', poste: 'Électricien Ind.', tags: ['Haute Tension', 'Maintenance'], score: 82, date: '12/10/2023', depuis: 'Il y a 4h', initiales: 'LM' },
  ],
  preselection: [
    { id: 'c3', nom: 'Karim Bennani', poste: 'Chef de Chantier', tags: ['BTP', 'Management'], score: 98, date: '10/10/2023', depuis: '11/10/2023', initiales: 'KB' },
  ],
  entretien: [
    { id: 'c4', nom: 'Nadia Mansouri', poste: 'Data Scientist', tags: ['Python', 'AWS'], score: 91, date: '09/10/2023', depuis: 'Il y a 1j', initiales: 'NM' },
  ],
  shortlist: [
    { id: 'c5', nom: 'Youssef Amrani', poste: 'Full-Stack Developer', tags: ['Node.js', 'React'], score: 96, date: '05/10/2023', depuis: 'Il y a 3j', initiales: 'YA' },
  ],
};
