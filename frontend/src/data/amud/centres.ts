/** Réexport fin — voir `centerTypes.ts` (types) et `centerDemoFactory.ts` (génération). */
export type {
  Centre,
  CenterStatus,
  PartnershipStatus,
  ThemeId,
  CenterSocialLinks,
  CenterHoraire,
  CenterSiteContent,
  CenterTestimonial,
  CenterFaqItem,
} from './centerTypes';
export { PARTNERSHIP_STATUSES, PARTNERSHIP_LABELS, PARTNERSHIP_CLASS, THEMES } from './centerTypes';
import { CENTER_DEMO } from './centerDemoFactory';
export const centresSeed = CENTER_DEMO.centres;
