import type { CandidateAccount } from './candidateAccount';
import type { CandidateDocument } from './candidateDocuments';
import type { CandidateOfferFavorite } from './candidateOfferFavorites';

// Matches the CRM identity, so applications, interviews and messages join naturally.
export const PRESENTATION_CANDIDATE_ID = 'candidate_youssefa';

export const presentationCandidate: CandidateAccount = {
  id: PRESENTATION_CANDIDATE_ID,
  prenom: 'Youssef', nom: 'Amrani',
  email: 'youssef@demo.amudskills.test', telephone: '+212600000099',
  ville: 'Casablanca', posteRecherche: 'Développeur Fullstack React/Node',
  situation: 'En poste', domaine: 'Informatique', metier: 'Développeur web',
  experienceAnnees: '4', competences: ['React', 'Node.js', 'TypeScript', 'SQL'],
  experiences: [
    { id: 'demo_exp_1', poste: 'Développeur Fullstack', entreprise: 'Atlas Digital', ville: 'Casablanca', dateDebut: '2023-01', enCours: true, description: 'Développement d’applications web et accompagnement des équipes produit.' },
    { id: 'demo_exp_2', poste: 'Développeur Frontend', entreprise: 'Casatech', ville: 'Rabat', dateDebut: '2021-09', dateFin: '2022-12', description: 'Interfaces accessibles et optimisation des performances.' },
  ],
  formations: [{ id: 'demo_formation_1', diplome: 'Licence en informatique', etablissement: 'Université Hassan II', annee: '2021', niveau: 'Bac+3' }],
  langues: [{ id: 'demo_lang_1', langue: 'Allemand', niveau: 'B1' }, { id: 'demo_lang_2', langue: 'Français', niveau: 'C1' }, { id: 'demo_lang_3', langue: 'Anglais', niveau: 'B2' }],
  allemagne: { niveau: 'B1', niveauVise: 'B2', metierRecherche: 'Développeur web', mobilite: 'Toute l’Allemagne', disponibilite: 'Sous 1 mois' },
  disponibilite: 'Sous 1 mois',
  preferencesPro: { contrat: 'CDI', villes: ['Berlin', 'Munich'], salaireMin: 4200, teletravail: 'Hybride' },
  onboarding: { step: 8, complete: true },
  createdAt: '2026-09-01T09:00:00.000Z', updatedAt: '2026-10-20T09:00:00.000Z',
};

export const presentationDocuments: CandidateDocument[] = [
  { id: 'demo_cv_youssef', candidateAccountId: PRESENTATION_CANDIDATE_ID, type: 'CV', nom: 'CV Youssef Amrani · Exemple', mimeType: 'text/plain', tailleKo: 1, dataUrl: 'data:text/plain;charset=utf-8,Youssef%20Amrani%20-%20CV%20de%20demonstration%0ADeveloppeur%20Fullstack%20React%20%2F%20Node.js%0A4%20ans%20d%27experience%20-%20Allemand%20B1', uploadedAt: '2026-10-15T09:00:00.000Z' },
  { id: 'demo_diploma_youssef', candidateAccountId: PRESENTATION_CANDIDATE_ID, type: 'Diplome', nom: 'Licence informatique · Exemple', mimeType: 'text/plain', tailleKo: 1, dataUrl: 'data:text/plain;charset=utf-8,Document%20fictif%20de%20demonstration%20-%20Licence%20en%20informatique', uploadedAt: '2026-10-15T09:00:00.000Z' },
];

export const presentationFavorites: CandidateOfferFavorite[] = [
  { id: 'demo_fav_youssef_1', candidateAccountId: PRESENTATION_CANDIDATE_ID, offerId: '5', createdAt: '2026-10-20T09:00:00.000Z' },
  { id: 'demo_fav_youssef_2', candidateAccountId: PRESENTATION_CANDIDATE_ID, offerId: '4', createdAt: '2026-10-20T09:00:00.000Z' },
];
