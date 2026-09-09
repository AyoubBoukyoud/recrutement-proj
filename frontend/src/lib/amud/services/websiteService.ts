'use client';

/**
 * Voir `storageService.ts` pour le principe de cette couche. Le contenu du
 * site public et le thème sont des champs de `Centre` (`site`, `theme`), pas
 * une collection séparée (cahier des charges §17 : `amud_public_sites` /
 * `amud_site_themes` seraient une copie 1-vers-1 de données déjà sur la
 * ligne du centre — la même donnée dans deux endroits est justement ce que
 * le cahier des charges interdit). `websiteService` isole donc les deux
 * écritures possibles (contenu, thème) derrière une API dédiée plutôt que
 * de laisser chaque appelant patcher `Centre` à la main.
 */
import { centresCollection } from '../localCentres';
import type { Centre, CenterSiteContent, ThemeId } from '@/data/amud/centres';
import { themeStyleFor, THEME_STYLES } from '../themeStyles';

export function updateSiteContent(centerId: string, site: CenterSiteContent) {
  return centresCollection.update(centerId, { site, updatedAt: new Date().toISOString() });
}

export function setSiteEnabled(centerId: string, enabled: boolean, current: Centre) {
  return centresCollection.update(centerId, { site: { ...current.site, enabled }, updatedAt: new Date().toISOString() });
}

export function setTheme(centerId: string, theme: ThemeId) {
  return centresCollection.update(centerId, { theme, updatedAt: new Date().toISOString() });
}

export { centresCollection, themeStyleFor, THEME_STYLES };
export type { ThemeId };
