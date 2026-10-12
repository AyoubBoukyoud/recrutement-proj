/**
 * Convertit ce que l'utilisateur colle dans le champ téléphone en E.164.
 *
 * Le sélecteur fournit le pays pour une saisie nationale (`07…`), mais un
 * numéro déjà international (`+212…` ou `00212…`) reste prioritaire. Les
 * indicatifs proposés par l'écran, Maroc et Allemagne, utilisent tous deux un
 * zéro national qui doit disparaître après l'indicatif.
 */
export function toInternationalPhone(input: string, selectedCountryCode: string): string {
  const compact = input.trim().replace(/[\s\-().]/g, '');

  if (compact.startsWith('+')) {
    return removeNationalTrunkPrefix(`+${compact.slice(1).replace(/\D/g, '')}`);
  }

  const digits = compact.replace(/\D/g, '');

  if (digits.startsWith('00')) {
    return removeNationalTrunkPrefix(`+${digits.slice(2)}`);
  }

  const countryDigits = selectedCountryCode.replace(/\D/g, '');
  if (digits.startsWith(countryDigits)) {
    return removeNationalTrunkPrefix(`+${digits}`);
  }

  const nationalNumber = digits.replace(/^0+/, '');

  return `${selectedCountryCode}${nationalNumber}`;
}

function removeNationalTrunkPrefix(phone: string): string {
  for (const countryCode of ['+212', '+49']) {
    if (phone.startsWith(`${countryCode}0`)) {
      return `${countryCode}${phone.slice(countryCode.length + 1)}`;
    }
  }

  return phone;
}

/* ------------------------------------------------------------------ *
 * Champ téléphone des formulaires d'administration (`PhoneField`).
 *
 * La saisie reste libre (« 06 32 59 49 14 », « +212 632-594-914 »,
 * « 00212632594914 »…) mais on dit tout de suite si le numéro est utilisable
 * pour recevoir un code WhatsApp, au lieu d'attendre une erreur 422 du serveur.
 * ------------------------------------------------------------------ */

export type PhoneCountry = { code: string; flag: string; label: string; placeholder: string };

/** `code: ''` = autre pays : la personne saisit le numéro complet avec « + ». */
export const PHONE_COUNTRIES: PhoneCountry[] = [
  { code: '+212', flag: '🇲🇦', label: '🇲🇦 +212', placeholder: '06 12 34 56 78' },
  { code: '+49', flag: '🇩🇪', label: '🇩🇪 +49', placeholder: '0151 2345678' },
  { code: '', flag: '🌍', label: '🌍 Autre', placeholder: '+33 6 12 34 56 78' },
];

export type PhoneCheck = {
  /** Numéro E.164 prêt à être envoyé, ou '' s'il est vide / inutilisable. */
  e164: string;
  valid: boolean;
  empty: boolean;
  /** Pourquoi le numéro n'est pas utilisable (affiché sous le champ). */
  message: string;
};

const E164 = /^\+[1-9]\d{7,14}$/;

export function checkPhone(input: string, countryCode: string): PhoneCheck {
  if (input.replace(/[\s\-().+]/g, '') === '') {
    return { e164: '', valid: false, empty: true, message: '' };
  }

  const full = countryCode === '' && !/^(\+|00)/.test(input.trim())
    ? `+${input.replace(/\D/g, '')}`
    : toInternationalPhone(input, countryCode || '+');

  if (full.startsWith('+212')) {
    return /^\+212[67]\d{8}$/.test(full)
      ? { e164: full, valid: true, empty: false, message: '' }
      : { e164: '', valid: false, empty: false, message: 'Un mobile marocain compte 9 chiffres et commence par 6 ou 7 (ex. 06 12 34 56 78).' };
  }

  if (full.startsWith('+49')) {
    return /^\+491[5-7]\d{8,9}$/.test(full)
      ? { e164: full, valid: true, empty: false, message: '' }
      : { e164: '', valid: false, empty: false, message: 'Un mobile allemand commence par 015, 016 ou 017 (ex. 0151 2345678).' };
  }

  return E164.test(full)
    ? { e164: full, valid: true, empty: false, message: '' }
    : { e164: '', valid: false, empty: false, message: "Numéro incomplet : indiquez l'indicatif du pays avec « + » (ex. +33 6 12 34 56 78)." };
}

/** Sépare un E.164 en indicatif connu + partie nationale (ou « autre pays »). */
export function splitInternationalPhone(e164: string): { country: string; national: string } {
  for (const c of PHONE_COUNTRIES) {
    if (c.code && e164.startsWith(c.code)) {
      return { country: c.code, national: formatNationalPhone(e164.slice(c.code.length), c.code) };
    }
  }
  return { country: '', national: e164 };
}

/** Écrit un numéro national comme sur une carte de visite : « 06 12 34 56 78 ». */
export function formatNationalPhone(input: string, countryCode: string): string {
  const digits = input.replace(/\D/g, '').replace(/^0+/, '');
  if (digits === '') return '';

  if (countryCode === '+212') {
    const d = digits.slice(0, 9);
    return `0${d.slice(0, 1)}${d.length > 1 ? ' ' : ''}${d.slice(1).replace(/(\d{2})(?=\d)/g, '$1 ')}`.trim();
  }

  if (countryCode === '+49') {
    const d = digits.slice(0, 11);
    return `0${d.slice(0, 3)}${d.length > 3 ? ' ' : ''}${d.slice(3)}`.trim();
  }

  return input;
}

/** « +212632594914 » → « +212 6 32 59 49 14 », pour confirmer ce qui sera enregistré. */
export function formatInternationalPhone(e164: string): string {
  const { country, national } = splitInternationalPhone(e164);
  if (!country) return e164;
  return `${country} ${national.replace(/^0/, '')}`;
}
