/**
 * Identité factice du commercial connecté à l'espace self-service
 * `/amud/commercial/*` (aucune authentification réelle dans ce module — cf.
 * mémoire projet). Le tableau de bord (`/amud/commercial`) salue déjà
 * "Bonjour Ahmed" en dur ; ce fichier donne un nom complet et un id à cette
 * même personne pour que les nouvelles pages (entreprises, activités,
 * tâches) puissent filtrer "mes données" de façon cohérente sans dupliquer
 * la logique de scoping dans chaque page.
 *
 * Volontairement distinct du roster `data/amud/commerciaux.ts` (géré côté
 * admin) : ce roster liste les commerciaux *gérés par l'admin*, alors que
 * `CURRENT_COMMERCIAL` représente l'utilisateur qui navigue dans l'espace
 * commercial — les deux ne se recoupent pas dans les maquettes source.
 */
export const CURRENT_COMMERCIAL = {
  id: 'ahmed-benali',
  nom: 'Ahmed Benali',
  initiales: 'AB',
} as const;
