/**
 * Pointeur de session mock du candidat connecté — pas une collection
 * (`createCollection` gère des listes), juste un petit blob JSON.
 * Contrairement aux autres espaces `/amud/*` (une seule personne factice
 * codée en dur, `CURRENT_EMPLOYER`/`CURRENT_COMMERCIAL`), ce module a un vrai
 * flux d'inscription/connexion mock : l'identité est créée par
 * `signupCandidate`, pas lue depuis une constante.
 */
const SESSION_KEY = 'amud_candidate_session';

export type CandidateSession = { candidateAccountId: string };

export function getCandidateSession(): CandidateSession | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = window.localStorage.getItem(SESSION_KEY);
    return raw ? (JSON.parse(raw) as CandidateSession) : null;
  } catch {
    return null;
  }
}

export function setCandidateSession(candidateAccountId: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(SESSION_KEY, JSON.stringify({ candidateAccountId }));
  window.dispatchEvent(new Event('amud-candidate-session-change'));
}

export function clearCandidateSession() {
  if (typeof window === 'undefined') return;
  window.localStorage.removeItem(SESSION_KEY);
  window.dispatchEvent(new Event('amud-candidate-session-change'));
}

export function subscribeCandidateSession(cb: () => void): () => void {
  if (typeof window === 'undefined') return () => {};
  window.addEventListener('amud-candidate-session-change', cb);
  return () => window.removeEventListener('amud-candidate-session-change', cb);
}
