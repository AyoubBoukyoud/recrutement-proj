/**
 * Profil "modifiable" du commercial connecté (`/amud/commercial/profile`,
 * cahier des charges §21-27). `CURRENT_COMMERCIAL` (`currentCommercial.ts`)
 * reste la source d'identité de base (nom, id, initiales) partagée par tout
 * l'espace self-service ; ce fichier ne couvre que les champs que le
 * cahier des charges autorise explicitement à modifier (téléphone, ville,
 * email, auto-évaluation des compétences, préférences) — jamais les
 * objectifs, qui restent en lecture seule et pilotés par
 * `data/amud/objectives.ts` (source unique gérée par l'Admin).
 */
export type CommercialSkill = { label: string; niveau: number }; // niveau : 1-5

export type CommercialProfileSettings = {
  id: string; // = CURRENT_COMMERCIAL.id
  telephone: string;
  ville: string;
  email: string;
  competences: CommercialSkill[];
  langue: 'Français' | 'Anglais' | 'Arabe';
  notifEmail: boolean;
  notifPush: boolean;
  notifRappels: boolean;
};

export const DEFAULT_COMMERCIAL_SKILLS: CommercialSkill[] = [
  { label: 'Prospection', niveau: 4 },
  { label: 'Communication', niveau: 5 },
  { label: 'Négociation', niveau: 4 },
  { label: 'Recrutement', niveau: 3 },
  { label: 'Vente', niveau: 4 },
  { label: 'Relation client', niveau: 5 },
  { label: 'CRM', niveau: 4 },
];

export const commercialProfileSettingsSeed: CommercialProfileSettings[] = [
  {
    id: 'ahmed-benali',
    telephone: '+212 6 61 23 45 67',
    ville: 'Casablanca',
    email: 'ahmed.benali@amudskills.com',
    competences: DEFAULT_COMMERCIAL_SKILLS,
    langue: 'Français',
    notifEmail: true,
    notifPush: true,
    notifRappels: true,
  },
];

export function getProfileSettingsForCommercial(commercialId: string, all: CommercialProfileSettings[] = commercialProfileSettingsSeed): CommercialProfileSettings | undefined {
  return all.find((s) => s.id === commercialId);
}
