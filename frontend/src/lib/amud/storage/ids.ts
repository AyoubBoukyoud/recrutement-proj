/** Génération d'identifiants type `candidate_a1b2c3d4` — évite les collisions des anciens `${prefix}-${Date.now()}`. */
export function generateId(prefix: string): string {
  const hasCrypto = typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function';
  const rand = hasCrypto ? crypto.randomUUID().replace(/-/g, '').slice(0, 8) : Math.random().toString(16).slice(2, 10);
  return `${prefix}_${rand}`;
}
