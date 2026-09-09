/**
 * Couche de services nommée du cahier des charges (§18) — `UI → Services →
 * Storage abstraction → localStorage`. Chaque service ci-dessous délègue
 * aux modules `lib/amud/local*.ts` et `lib/amud/storage/*.ts` déjà en place
 * (mêmes collections, mêmes clés `AMUD_KEYS`, même hook `useCollection`) —
 * ce ne sont pas de nouvelles implémentations parallèles : renommer une
 * fonction ici sans changer son comportement serait le vrai risque de
 * duplication que le cahier des charges interdit (§17). L'objectif est que
 * le code puisse, plus tard, être écrit contre `studentService`/
 * `centerService`/etc. plutôt que d'importer une collection localStorage
 * directement — sans que rien ne change sous le capot.
 *
 * `storageService` est la brique la plus basse : primitives génériques
 * (créer une collection, générer un id) que les autres services
 * construisent par-dessus.
 */
export { createCollection } from '../storage/collection';
export type { Collection, Entity } from '../storage/collection';
export { useCollection } from '../storage/useCollection';
export { generateId } from '../storage/ids';
export { AMUD_KEYS } from '../storage/keys';
export { subscribeAmudChange, emitAmudChange } from '../storage/events';
