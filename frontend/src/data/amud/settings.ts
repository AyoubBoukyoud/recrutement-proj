/**
 * Réglages de l'espace entreprise (`/amud/entreprise/parametres`). Une ligne
 * par entreprise (`id` = `Entreprise.id`), réutilisant `AMUD_KEYS.settings`
 * (réservée mais jamais consommée avant cette page).
 */
export type ProfileVisibility = 'Publique' | 'Privée';
export type Language = 'Français' | 'Anglais' | 'Arabe';

export type CompanySettings = {
  id: string;
  notifyEmailApplications: boolean;
  notifyEmailMessages: boolean;
  notifyPushInterviews: boolean;
  twoFactorEnabled: boolean;
  profileVisibility: ProfileVisibility;
  language: Language;
};

export function defaultCompanySettings(entrepriseId: string): CompanySettings {
  return {
    id: entrepriseId,
    notifyEmailApplications: true,
    notifyEmailMessages: true,
    notifyPushInterviews: true,
    twoFactorEnabled: false,
    profileVisibility: 'Publique',
    language: 'Français',
  };
}
