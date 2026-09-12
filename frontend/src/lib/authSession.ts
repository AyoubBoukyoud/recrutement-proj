import { deleteCookie } from '@/lib/cookies';
import { removeStorage, STORAGE_KEYS } from '@/lib/storage';

let redirectStarted = false;

/**
 * Close a stale browser session after an authenticated API request returns
 * 401. A 403 is deliberately not handled here: it is an authorization error,
 * not proof that the session expired.
 */
export function recoverFromUnauthorized(): void {
  if (typeof window === 'undefined' || redirectStarted) return;

  redirectStarted = true;
  removeStorage(STORAGE_KEYS.auth);
  removeStorage(STORAGE_KEYS.token);
  deleteCookie('as_role');
  deleteCookie('as_uid');
  window.location.assign('/auth-phone?reason=session_expired');
}
