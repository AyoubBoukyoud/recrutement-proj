/**
 * Jeu de données factice partagé par les pages `/amud/admin/*` qui touchent
 * aux commerciaux (tableau de bord, liste, profil 360, objectifs). Les
 * maquettes sources utilisaient des noms différents d'un écran à l'autre
 * (générations indépendantes) — ce fichier consolide un seul roster pour
 * que les liens entre pages (liste → profil, leaderboard → profil) pointent
 * vers un enregistrement cohérent plutôt que de casser sur un id inconnu.
 */
export type StatutPresence = 'en_ligne' | 'en_appel' | 'hors_ligne';

export type Commercial = {
  id: string;
  prenom: string;
  nom: string;
  fonction: string;
  ville: string;
  email: string;
  telephone: string;
  dateEntree: string;
  statut: StatutPresence;
  avatarInitials: string;
  objectifAppelsJour: number;
  appelsJour: number;
  tauxReponse: number;
  rdvSemaine: number;
  objectifRdvSemaine: number;
  candidatsContactes: number;
  recruteursContactes: number;
  objectifMensuel: number;
  realiseMensuel: number;
  conversionsMois: number;
  objectifConversionsMois: number;
  tauxConversion: number;
};

export const commerciaux: Commercial[] = [
  {
    id: 'jean-dupont',
    prenom: 'Jean',
    nom: 'Dupont',
    fonction: 'Commercial Senior',
    ville: 'Paris',
    email: 'jean.dupont@amudskills.com',
    telephone: '+33 6 12 34 56 78',
    dateEntree: '12/03/2023',
    statut: 'en_ligne',
    avatarInitials: 'JD',
    objectifAppelsJour: 50,
    appelsJour: 42,
    tauxReponse: 68,
    rdvSemaine: 12,
    objectifRdvSemaine: 15,
    candidatsContactes: 145,
    recruteursContactes: 24,
    objectifMensuel: 500,
    realiseMensuel: 520,
    conversionsMois: 8,
    objectifConversionsMois: 10,
    tauxConversion: 12,
  },
  {
    id: 'marie-lambert',
    prenom: 'Marie',
    nom: 'Lambert',
    fonction: 'Account Executive',
    ville: 'Lyon',
    email: 'marie.lambert@amudskills.com',
    telephone: '+33 6 22 33 44 55',
    dateEntree: '05/09/2023',
    statut: 'en_appel',
    avatarInitials: 'ML',
    objectifAppelsJour: 30,
    appelsJour: 15,
    tauxReponse: 65,
    rdvSemaine: 7,
    objectifRdvSemaine: 15,
    candidatsContactes: 98,
    recruteursContactes: 15,
    objectifMensuel: 450,
    realiseMensuel: 450,
    conversionsMois: 7,
    objectifConversionsMois: 7,
    tauxConversion: 10,
  },
  {
    id: 'paul-leroy',
    prenom: 'Paul',
    nom: 'Leroy',
    fonction: 'Junior SDR',
    ville: 'Marseille',
    email: 'paul.leroy@amudskills.com',
    telephone: '+33 6 33 44 55 66',
    dateEntree: '02/01/2024',
    statut: 'hors_ligne',
    avatarInitials: 'PL',
    objectifAppelsJour: 40,
    appelsJour: 5,
    tauxReponse: 45,
    rdvSemaine: 2,
    objectifRdvSemaine: 15,
    candidatsContactes: 40,
    recruteursContactes: 6,
    objectifMensuel: 500,
    realiseMensuel: 175,
    conversionsMois: 2,
    objectifConversionsMois: 10,
    tauxConversion: 4,
  },
  {
    id: 'sophie-martin',
    prenom: 'Sophie',
    nom: 'Martin',
    fonction: 'Account Executive',
    ville: 'Casablanca',
    email: 'sophie.martin@amudskills.com',
    telephone: '+33 6 44 55 66 77',
    dateEntree: '10/08/2022',
    statut: 'en_ligne',
    avatarInitials: 'SM',
    objectifAppelsJour: 45,
    appelsJour: 40,
    tauxReponse: 74,
    rdvSemaine: 13,
    objectifRdvSemaine: 15,
    candidatsContactes: 210,
    recruteursContactes: 34,
    objectifMensuel: 500,
    realiseMensuel: 520,
    conversionsMois: 11,
    objectifConversionsMois: 10,
    tauxConversion: 15,
  },
  {
    id: 'thomas-dubois',
    prenom: 'Thomas',
    nom: 'Dubois',
    fonction: 'Commercial Senior',
    ville: 'Bordeaux',
    email: 'thomas.dubois@amudskills.com',
    telephone: '+33 6 55 66 77 88',
    dateEntree: '18/04/2023',
    statut: 'en_ligne',
    avatarInitials: 'TD',
    objectifAppelsJour: 45,
    appelsJour: 41,
    tauxReponse: 70,
    rdvSemaine: 10,
    objectifRdvSemaine: 12,
    candidatsContactes: 160,
    recruteursContactes: 20,
    objectifMensuel: 450,
    realiseMensuel: 450,
    conversionsMois: 9,
    objectifConversionsMois: 9,
    tauxConversion: 11,
  },
  {
    id: 'emma-leroy',
    prenom: 'Emma',
    nom: 'Leroy',
    fonction: 'Junior SDR',
    ville: 'Lyon',
    email: 'emma.leroy@amudskills.com',
    telephone: '+33 6 66 77 88 99',
    dateEntree: '10/08/2023',
    statut: 'hors_ligne',
    avatarInitials: 'EL',
    objectifAppelsJour: 40,
    appelsJour: 12,
    tauxReponse: 38,
    rdvSemaine: 3,
    objectifRdvSemaine: 12,
    candidatsContactes: 55,
    recruteursContactes: 8,
    objectifMensuel: 600,
    realiseMensuel: 210,
    conversionsMois: 2,
    objectifConversionsMois: 12,
    tauxConversion: 3,
  },
];

export function getCommercial(id: string) {
  return commerciaux.find((c) => c.id === id);
}

export const STATUT_LABEL: Record<StatutPresence, string> = {
  en_ligne: 'En ligne',
  en_appel: 'En appel',
  hors_ligne: 'Hors ligne',
};
