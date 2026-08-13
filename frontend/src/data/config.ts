/**
 * Le commutateur maquettes / API réelle.
 *
 * La phase de développement en cours porte sur les interfaces : les écrans
 * doivent pouvoir tourner sans Laravel, sans base, sans Docker. Chaque module
 * de `src/data` expose donc deux implémentations derrière une même signature,
 * et c'est ce drapeau qui tranche.
 *
 * Explicitement `=== '1'`, jamais l'inverse : un build sans variable
 * d'environnement parle à la vraie API. On ne veut pas qu'un oubli de
 * configuration en production serve des données inventées.
 *
 *   .env.local  →  NEXT_PUBLIC_USE_MOCKS=1   (travail sur les interfaces)
 *   production  →  variable absente          (API réelle)
 */
export const USE_MOCKS = process.env.NEXT_PUBLIC_USE_MOCKS === '1';

/**
 * Fait attendre une maquette comme le ferait le réseau.
 *
 * Sans cela, tout état de chargement — squelette, bouton désactivé, spinner —
 * serait invisible en développement et ne se révélerait qu'une fois branché
 * sur l'API. Les écrans se dessinent donc contre une latence plausible.
 */
export function fakeLatency<T>(value: T, ms = 320): Promise<T> {
  return new Promise((resolve) => setTimeout(() => resolve(value), ms));
}

/** Même chose pour un échec : les chemins d'erreur se maquettent aussi. */
export function fakeFailure(error: Error, ms = 320): Promise<never> {
  return new Promise((_, reject) => setTimeout(() => reject(error), ms));
}
