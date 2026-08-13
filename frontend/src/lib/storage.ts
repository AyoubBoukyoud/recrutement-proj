// Helpers localStorage sûrs pour le rendu SSR (Next.js)

export function readStorage<T>(key: string, fallback: T): T {
  if (typeof window === 'undefined') return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function writeStorage<T>(key: string, value: T): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // stockage plein ou indisponible : on ignore silencieusement
  }
}

export function removeStorage(key: string): void {
  if (typeof window === 'undefined') return;
  try {
    window.localStorage.removeItem(key);
  } catch {
    // ignore
  }
}

export const STORAGE_KEYS = {
  auth: 'as_auth_user',
  token: 'as_auth_token',
  profile: 'as_candidate_profile',
  language: 'as_language',
  syncQueue: 'as_sync_queue',
  installPromptDismissedAt: 'as_install_prompt_dismissed_at',
} as const;
