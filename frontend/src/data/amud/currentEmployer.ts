/**
 * Identité factice de l'entreprise connectée à l'espace entreprise
 * `/amud/entreprise/*` (aucune authentification réelle dans ce module — cf.
 * mémoire projet, même pattern que `CURRENT_COMMERCIAL` pour l'espace
 * commercial). TechCorp SA (`entreprisesSeed` id '1') a une offre publiée et
 * plusieurs candidatures actives dans `applicationsSeed`, ce qui donne un
 * tableau de bord représentatif dès le premier chargement. `userNom`/`userId`
 * représentent la personne "connectée" au sein de l'entreprise — correspond
 * à `recruiter_techcorp1` (Fatima Zahra, `ADMIN_ENTREPRISE`) dans `recruiters.ts`
 * — utilisée pour les salutations, le journal d'audit et la ligne "Vous" de
 * `/amud/entreprise/equipe`.
 */
export const CURRENT_EMPLOYER = {
  entrepriseId: '1',
  entrepriseNom: 'TechCorp SA',
  userId: 'recruiter_techcorp1',
  userNom: 'Fatima Zahra',
} as const;
