// Traduction d'un échec d'authentification en message affichable. Isolé ici
// parce que l'écran du numéro et l'écran du code traitent les mêmes cas.

import type { AuthFailure, AuthResult } from '@/context/AuthContext';
import type { TranslationKey } from '@/lib/i18n';
import type { GoogleFailure } from '@/lib/googleAuth';

const MESSAGE_KEY: Record<AuthFailure, TranslationKey> = {
  invalid: 'otp_error_invalid',
  expired: 'otp_error_expired',
  too_many_attempts: 'otp_error_too_many_attempts',
  throttled: 'otp_error_throttled',
  delivery: 'otp_error_delivery',
  network: 'otp_error_network',
  blocked: 'otp_error_blocked',
  unknown: 'error_generic',
};

export function otpFailureMessage(result: AuthResult, t: (key: TranslationKey) => string): string {
  if (result.ok) return '';

  const message = t(MESSAGE_KEY[result.reason]);

  // Le dictionnaire n'interpole pas : le compte à rebours est ajouté ici.
  return result.retryAfter ? `${message} (${result.retryAfter}s)` : message;
}

const GOOGLE_MESSAGE_KEY: Record<GoogleFailure, TranslationKey> = {
  cancelled: 'google_error_cancelled',
  expired: 'google_error_expired',
  failed: 'google_error_failed',
  unavailable: 'google_error_unavailable',
  unverified_email: 'google_error_unverified_email',
  blocked: 'otp_error_blocked',
  conflict: 'google_error_conflict',
  network: 'otp_error_network',
};

export function googleFailureMessage(failure: GoogleFailure, t: (key: TranslationKey) => string): string {
  return t(GOOGLE_MESSAGE_KEY[failure]);
}
