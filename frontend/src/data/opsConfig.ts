/**
 * Réglages des maquettes de l'espace ops (recruteur/admin/agent, portés
 * depuis web-admin). Distinct de `data/config.ts`, qui sert les dépôts du
 * candidat — les deux jeux de maquettes sont volontairement gardés séparés,
 * chacun avec sa propre latence.
 *
 * Le commutateur maquettes / API réelle ne vit pas ici : il est lu
 * littéralement dans `lib/opsApi.ts`, sous la forme
 * `process.env.NEXT_PUBLIC_USE_MOCKS === '1'`. Next substitue cette
 * expression par une constante à la compilation (voir la valeur de repli
 * dans next.config.mjs), et webpack élimine alors tout ce module —
 * adaptateur et jeux de données compris — d'un build de production. Passer
 * par une constante exportée d'ici casserait cette élimination et
 * embarquerait les faux candidats dans l'application livrée.
 *
 *   .env.local  →  NEXT_PUBLIC_USE_MOCKS=1   (travail sur les interfaces)
 *   production  →  variable absente          (API réelle)
 */

/** Fait attendre une maquette comme le ferait le réseau, pour que les états
 *  de chargement soient visibles pendant qu'on les dessine. */
export const MOCK_LATENCY_MS = 280
