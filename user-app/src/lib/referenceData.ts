// Constantes de domaine — ni maquettes ni réponses d'API. Elles valent la
// même chose que le back soit branché ou non, et ne passent donc pas par
// `src/data`.

/** Les secteurs proposés à l'inscription. */
export const SECTORS = ['IT', 'Santé', 'BTP', 'Artisanat', 'Hôtellerie', 'Logistique'];

/** L'échelle du Cadre européen commun de référence pour les langues. */
export const CEFR_LEVELS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'] as const;

export type CefrLevel = (typeof CEFR_LEVELS)[number];
