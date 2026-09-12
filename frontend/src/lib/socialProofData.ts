// Preuve sociale : partenaires, statistiques, témoignages.
//
// Ces trois listes démarrent vides et le restent tant qu'aucune donnée réelle
// n'a été validée — la page interdit explicitement les chiffres, logos et
// témoignages non vérifiés (voir `_note` de home.fr.json, §7.3). Chaque
// composant (`SocialProofSection`, `StatsSection`, `TestimonialsSection`)
// n'affiche rien quand sa liste est vide : ajouter une entrée ici suffit à
// faire apparaître la section, sans toucher au composant.
//
// Le texte des témoignages est saisi une fois par langue (`quote`), à la
// différence du reste du contenu qui vit dans `src/content/*.json` : ce sont
// des citations entrées au moment où un vrai témoignage existe, pas des
// chaînes d'interface à maintenir en continu.

import type { Language } from '@/lib/types';

export interface Partner {
  id: string;
  name: string;
  /** Chemin vers le logo du partenaire. */
  logo: string;
  logoAlt: string;
  href?: string;
}

export interface Stat {
  id: string;
  /** Valeur déjà formatée pour l'affichage (ex. "128"), jamais un objectif commercial. */
  value: string;
  label: Record<Language, string>;
}

export interface Testimonial {
  id: string;
  firstName: string;
  lastNameInitial: string;
  city: string;
  trade: string;
  photo?: string;
  photoAlt?: string;
  videoUrl?: string;
  quote: Record<Language, string>;
  milestones: Array<'profileCompleted' | 'matched' | 'hired'>;
}

export const PARTNERS: Partner[] = [];

export const STATS: Stat[] = [];

export const TESTIMONIALS: Testimonial[] = [];
