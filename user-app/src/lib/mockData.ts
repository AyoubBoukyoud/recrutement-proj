import type {
  AdminUserEntry,
  CandidateSummary,
  Conversation,
  JobListing,
  JobOffer,
  ReclamationEntry,
  ReferralEntry,
  TimelineStep,
} from './types';

export const MOCK_JOB_OFFERS: JobOffer[] = [
  { id: 'job_1', company: 'TechGmbH Munich 🇩🇪', role: 'Développeur Full-Stack (React/Laravel)', location: 'Munich', salary: '55 000€ – 65 000€ / an', status: 'entretien' },
  { id: 'job_2', company: 'Innovate Berlin 🇩🇪', role: 'Ingénieur Backend (Node.js/PHP)', location: 'Berlin', salary: '58 000€ / an', status: 'envoye' },
  { id: 'job_3', company: 'Nordbau Hamburg 🇩🇪', role: 'Chef de chantier', location: 'Hambourg', salary: '48 000€ / an', status: 'nouveau' },
];

export const MOCK_CANDIDATES: CandidateSummary[] = [
  { id: 'cand_1', name: 'Youssef Amrani', avatarInitials: 'YA', role: 'Développeur Full-Stack', sector: 'IT', city: 'Casablanca', languageLevel: 'B2', yearsExperience: 4, status: 'entretien', matchScore: 92, mutualInterest: true },
  { id: 'cand_2', name: 'Salma Bennis', avatarInitials: 'SB', role: 'Infirmière diplômée', sector: 'Santé', city: 'Rabat', languageLevel: 'B1', yearsExperience: 6, status: 'nouveau', matchScore: 87, mutualInterest: false },
  { id: 'cand_3', name: 'Karim El Fassi', avatarInitials: 'KF', role: 'Électricien industriel', sector: 'Artisanat', city: 'Tanger', languageLevel: 'A2', yearsExperience: 8, status: 'contacte', matchScore: 78, mutualInterest: false },
  { id: 'cand_4', name: 'Imane Ouahbi', avatarInitials: 'IO', role: 'Ingénieure Backend', sector: 'IT', city: 'Marrakech', languageLevel: 'B2', yearsExperience: 3, status: 'valide', matchScore: 95, mutualInterest: true },
  { id: 'cand_5', name: 'Hamza Rachidi', avatarInitials: 'HR', role: 'Chef de chantier', sector: 'BTP', city: 'Fès', languageLevel: 'A2', yearsExperience: 10, status: 'nouveau', matchScore: 74, mutualInterest: false },
];

export const MOCK_CONVERSATIONS: Conversation[] = [
  {
    id: 'conv_1',
    candidateId: 'cand_1',
    candidateName: 'Youssef Amrani',
    lastMessage: 'Merci, je suis disponible pour un entretien la semaine prochaine.',
    lastMessageAt: '2026-07-30T10:12:00Z',
    unread: 1,
    messages: [
      { id: 'm1', authorId: 'emp_1', authorRole: 'employer', text: 'Bonjour Youssef, votre profil nous intéresse beaucoup.', sentAt: '2026-07-29T09:00:00Z' },
      { id: 'm2', authorId: 'cand_1', authorRole: 'candidate', text: 'Merci, je suis disponible pour un entretien la semaine prochaine.', sentAt: '2026-07-30T10:12:00Z' },
    ],
  },
  {
    id: 'conv_2',
    candidateId: 'cand_4',
    candidateName: 'Imane Ouahbi',
    lastMessage: 'Parfait, à bientôt !',
    lastMessageAt: '2026-07-28T15:40:00Z',
    unread: 0,
    messages: [
      { id: 'm3', authorId: 'emp_1', authorRole: 'employer', text: 'Bonjour Imane, bienvenue chez Innovate Berlin.', sentAt: '2026-07-28T15:30:00Z' },
      { id: 'm4', authorId: 'cand_4', authorRole: 'candidate', text: 'Parfait, à bientôt !', sentAt: '2026-07-28T15:40:00Z' },
    ],
  },
];

export const MOCK_TIMELINE: TimelineStep[] = [
  { id: 'step_1', label: 'Dossier validé', description: 'Votre dossier a été vérifié par notre équipe.', status: 'termine', date: '2026-06-02' },
  { id: 'step_2', label: 'Contrat signé', description: 'Contrat de travail signé avec TechGmbH Munich.', status: 'termine', date: '2026-06-20' },
  { id: 'step_3', label: 'Demande de visa', description: 'Dépôt du dossier de visa de travail auprès du consulat allemand.', status: 'en_cours', date: null },
  { id: 'step_4', label: 'Relocalisation', description: 'Organisation du logement et du déménagement à Munich.', status: 'a_venir', date: null },
  { id: 'step_5', label: 'Prise de poste', description: "Premier jour de travail chez l'employeur.", status: 'a_venir', date: null },
];

export const MOCK_RECLAMATIONS: ReclamationEntry[] = [
  { id: 'rec_1', subject: 'Document refusé', category: 'Documents', message: "Mon diplôme a été marqué comme illisible alors qu'il est net.", status: 'ouverte', createdAt: '2026-07-29T08:00:00Z', authorName: 'Youssef Amrani', authorRole: 'candidate' },
  { id: 'rec_2', subject: 'Retard de réponse employeur', category: 'Messagerie', message: "Aucune réponse depuis 2 semaines suite à l'entretien.", status: 'en_cours', createdAt: '2026-07-25T08:00:00Z', authorName: 'Salma Bennis', authorRole: 'candidate' },
  { id: 'rec_3', subject: 'Question sur le visa', category: 'Administratif', message: 'Quels documents sont nécessaires pour le rendez-vous consulaire ?', status: 'resolue', createdAt: '2026-07-10T08:00:00Z', authorName: 'Hamza Rachidi', authorRole: 'candidate' },
];

export const MOCK_ADMIN_USERS: AdminUserEntry[] = [
  { id: 'u1', name: 'Youssef Amrani', role: 'candidate', email: 'y.amrani@example.com', status: 'actif', createdAt: '2026-05-01' },
  { id: 'u2', name: 'TechGmbH Munich', role: 'employer', email: 'contact@techgmbh.de', status: 'actif', createdAt: '2026-04-15' },
  { id: 'u3', name: 'Salma Bennis', role: 'candidate', email: 's.bennis@example.com', status: 'en_attente', createdAt: '2026-07-20' },
  { id: 'u4', name: 'Karim El Fassi', role: 'candidate', email: 'k.elfassi@example.com', status: 'suspendu', createdAt: '2026-03-11' },
  { id: 'u5', name: 'Innovate Berlin', role: 'employer', email: 'hr@innovate.de', status: 'actif', createdAt: '2026-02-02' },
];

export const MOCK_REFERRALS: ReferralEntry[] = [
  { id: 'ref_1', sponsorName: 'Youssef Amrani', refereeName: 'Nadia Kabbaj', status: 'recrute', reward: '150€ crédités', createdAt: '2026-05-10' },
  { id: 'ref_2', sponsorName: 'Salma Bennis', refereeName: 'Adil Moujahid', status: 'inscrit', reward: 'En attente', createdAt: '2026-06-18' },
  { id: 'ref_3', sponsorName: 'Karim El Fassi', refereeName: 'Rania Tazi', status: 'invite', reward: 'En attente', createdAt: '2026-07-22' },
];

export const MOCK_JOB_LISTINGS: JobListing[] = [
  { id: 'list_1', role: 'Infirmier Qualifié', company: 'Klinik Berlin', sector: 'Santé', location: 'Berlin, Allemagne', salaryRange: '3 200€ – 3 800€ / mois', levelRequired: 'B1 requis', contractType: 'Plein temps' },
  { id: 'list_2', role: 'Réceptionniste', company: 'Hôtel München', sector: 'Hôtellerie', location: 'Munich, Allemagne', salaryRange: '2 400€ – 2 900€ / mois', levelRequired: 'B2 recommandé', contractType: 'CDI' },
  { id: 'list_3', role: 'Électricien de Bâtiment', company: 'Elektro Gmbh', sector: 'Artisanat', location: 'Hambourg, Allemagne', salaryRange: '3 000€ – 3 500€ / mois', levelRequired: 'B1 requis', contractType: 'Déplacement' },
  { id: 'list_4', role: 'Chauffeur PL', company: 'Logistik Nord', sector: 'Logistique', location: 'Francfort, Allemagne', salaryRange: '2 800€ – 3 200€ / mois', levelRequired: 'A2 suffisant', contractType: 'Urgent', urgent: true },
];

export const SECTORS = ['IT', 'Santé', 'BTP', 'Artisanat', 'Hôtellerie', 'Logistique'];
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;
