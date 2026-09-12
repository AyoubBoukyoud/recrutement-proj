/** Validation partagée pour les formulaires de l'espace entreprise (cahier des charges §46). */
export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/[\s().-]/g, '');
  return /^\+?\d{8,15}$/.test(digits);
}

export function isRequired(value: string | undefined | null): boolean {
  return typeof value === 'string' && value.trim().length > 0;
}
