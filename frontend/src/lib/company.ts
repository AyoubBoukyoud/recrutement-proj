import { SITE_URL } from '@/lib/site';

/**
 * L'identité publique de l'entreprise : source unique du pied de page, de la
 * page « Notre entreprise » et des données structurées (JSON-LD).
 *
 * Les champs facultatifs ne s'affichent que renseignés : on ne publie rien
 * d'approximatif. Les remplir au fur et à mesure, tels qu'ils figurent sur les
 * documents officiels (extrait RC, statuts, ICE…).
 */
export interface Founder {
  name: string;
  /** Fonction affichée sous le nom, ex. « Cofondateur & CEO ». */
  role: string;
  linkedin?: string;
}

export interface CompanyProfile {
  name: string;
  url: string;
  logo: string;
  email: string;
  social: { instagram: string; facebook: string; linkedin: string };
  /** Raison sociale exacte, ex. « AMUD SKILLS SARL ». */
  legalName?: string;
  /** Forme juridique, ex. « SARL », « SAS ». */
  legalForm?: string;
  /** Numéros d'immatriculation tels qu'écrits, ex. « RC 123456 · ICE 001234567890123 ». */
  registration?: string;
  city?: string;
  /** Code pays ISO 3166-1 alpha-2 (« MA », « DE »…) ; le nom est localisé à l'affichage. */
  countryCode?: string;
  /** Format `AAAA-MM` ou `AAAA-MM-JJ`. */
  foundingDate?: string;
  founders: Founder[];
}

export const COMPANY: CompanyProfile = {
  name: 'AMUD Skills',
  url: SITE_URL,
  logo: `${SITE_URL}/landing-assets/amud-logo-brand.png`,
  email: 'contact@amudskills.com',
  social: {
    instagram: 'https://www.instagram.com/amud_skills/',
    facebook: 'https://www.facebook.com/profile.php?id=61590919101643',
    linkedin: 'https://ma.linkedin.com/company/amud_skills',
  },
  founders: [],
};

/** « Casablanca, Maroc » : ville et pays renseignés, dans la langue de la page. */
export function companyPlace(locale: string): string | undefined {
  const { city, countryCode } = COMPANY;
  const country = countryCode ? new Intl.DisplayNames([locale], { type: 'region' }).of(countryCode) : undefined;
  return [city, country].filter(Boolean).join(', ') || undefined;
}

/** « mars 2026 » (ou « March 2026 », « مارس 2026 »…), à partir de `foundingDate`. */
export function companyFounded(locale: string): string | undefined {
  const { foundingDate } = COMPANY;
  if (!foundingDate) return undefined;
  const date = new Date(`${foundingDate.slice(0, 7)}-01T00:00:00Z`);
  return Number.isNaN(date.getTime())
    ? undefined
    : date.toLocaleDateString(locale, { month: 'long', year: 'numeric', timeZone: 'UTC' });
}
