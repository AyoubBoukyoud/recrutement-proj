/**
 * « Continuer avec Google » côté navigateur.
 *
 * Tout le protocole OAuth vit dans Laravel (`/api/auth/google/*`) : le
 * navigateur quitte l'app pour l'API, l'API l'envoie chez Google, Google le
 * renvoie à l'API, et l'API le renvoie sur /auth-google avec le résultat dans
 * le fragment d'URL. Aucun secret, aucun jeton d'accès ne passe par ici.
 *
 * `flow` est une valeur aléatoire gardée dans cet onglet avant de partir, et
 * que l'API recopie au retour. /auth-google refuse un résultat qui ne la porte
 * pas : un lien fabriqué par un tiers ne peut donc pas connecter quelqu'un au
 * compte de ce tiers.
 *
 * sessionStorage plutôt que localStorage : rien de tout cela ne doit survivre
 * à l'onglet, ni fuir vers un autre.
 */
import { API_BASE_URL } from '@/lib/api';

/** Le bouton n'apparaît que si le déploiement a configuré Google. */
export const GOOGLE_SIGN_IN_ENABLED =
  process.env.NEXT_PUBLIC_GOOGLE_SIGN_IN === '1' && process.env.NEXT_PUBLIC_USE_MOCKS !== '1';

const FLOW_KEY = 'as_google_flow';
const LINK_KEY = 'as_google_link';

/** Ce que l'API peut renvoyer dans `#error=` — voir GoogleAuthController. */
export type GoogleFailure =
  | 'cancelled'
  | 'expired'
  | 'failed'
  | 'unavailable'
  | 'unverified_email'
  | 'blocked'
  | 'conflict'
  | 'network';

const KNOWN_FAILURES: readonly GoogleFailure[] = [
  'cancelled',
  'expired',
  'failed',
  'unavailable',
  'unverified_email',
  'blocked',
  'conflict',
  'network',
];

export function asGoogleFailure(value: string | null | undefined): GoogleFailure | null {
  if (!value) return null;
  return (KNOWN_FAILURES as readonly string[]).includes(value) ? (value as GoogleFailure) : 'failed';
}

/** Compte Google vérifié mais pas encore rattaché : le numéro reste à confirmer. */
export type PendingGoogleLink = { ticket: string; email: string };

function session(): Storage | null {
  try {
    return typeof window === 'undefined' ? null : window.sessionStorage;
  } catch {
    return null;
  }
}

function randomFlow(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/**
 * Quitte l'app pour Google. Navigation pleine page, pas de popup : c'est ce
 * qui marche partout, y compris dans une PWA installée et sur mobile.
 */
export function startGoogleSignIn(): void {
  const flow = randomFlow();
  session()?.setItem(FLOW_KEY, flow);
  window.location.assign(`${API_BASE_URL}/auth/google/redirect?flow=${encodeURIComponent(flow)}`);
}

/** Lit puis efface le `flow` de cet onglet : il ne sert qu'à un retour. */
export function consumeGoogleFlow(): string | null {
  const store = session();
  const flow = store?.getItem(FLOW_KEY) ?? null;
  store?.removeItem(FLOW_KEY);
  return flow;
}

export function savePendingGoogleLink(link: PendingGoogleLink): void {
  session()?.setItem(LINK_KEY, JSON.stringify(link));
}

export function readPendingGoogleLink(): PendingGoogleLink | null {
  try {
    const raw = session()?.getItem(LINK_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<PendingGoogleLink>;
    return typeof parsed.ticket === 'string' && typeof parsed.email === 'string'
      ? { ticket: parsed.ticket, email: parsed.email }
      : null;
  } catch {
    return null;
  }
}

export function clearPendingGoogleLink(): void {
  session()?.removeItem(LINK_KEY);
}
