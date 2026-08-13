// Traduction d'un échec d'authentification en message affichable. Isolé ici
// parce que l'écran du numéro et l'écran du code traitent les mêmes cas.

import type { AuthFailure, AuthResult } from '@/context/AuthContext';
import type { TranslationKey } from '@/lib/i18n';

const MESSAGE_KEY: Record<AuthFailure, TranslationKey> = {
  invalid: 'otp_error_invalid',
  expired: 'otp_error_expired',
  too_many_attempts: 'otp_error_too_many_attempts',
  throttled: 'otp_error_throttled',
  delivery: 'otp_error_delivery',
  network: 'otp_error_network',
  unknown: 'error_generic',
};

export function otpFailureMessage(result: AuthResult, t: (key: TranslationKey) => string): string {
  if (result.ok) return '';

  const message = t(MESSAGE_KEY[result.reason]);

  // Le dictionnaire n'interpole pas : le compte à rebours est ajouté ici.
  return result.retryAfter ? `${message} (${result.retryAfter}s)` : message;
}
