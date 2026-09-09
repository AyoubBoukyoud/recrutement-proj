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
