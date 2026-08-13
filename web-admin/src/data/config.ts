/**
 * Réglages des maquettes de l'espace ops.
 *
 * Le commutateur maquettes / API réelle ne vit pas ici : il est lu
 * littéralement dans `lib/api.ts`, sous la forme
 * `import.meta.env.VITE_USE_MOCKS === '1'`. Vite substitue `import.meta.env` à
 * la compilation, la condition devient donc une constante et Rollup élimine
 * tout ce module — adaptateur et jeux de données compris — d'un build de
 * production. Passer par une constante exportée d'ici casserait cette
 * élimination et embarquerait les faux candidats dans l'application livrée.
 *
 *   .env.local  →  VITE_USE_MOCKS=1   (travail sur les interfaces)
 *   production  →  variable absente   (API réelle)
 */

/** Fait attendre une maquette comme le ferait le réseau, pour que les états
 *  de chargement soient visibles pendant qu'on les dessine. */
export const MOCK_LATENCY_MS = 280
