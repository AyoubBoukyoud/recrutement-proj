'use client';

// Passerelle entre la langue choisie et les contenus traduits.
//
// La langue vit dans le stockage local, donc le serveur ne peut pas la
// connaître : le premier rendu est en français et bascule après hydratation.
// C'est un compromis assumé — l'alternative (un préfixe de langue dans l'URL)
// restructurerait tout l'arbre de routes de l'application.

import { useLanguage } from '@/context/LanguageContext';
import type { Language } from '@/lib/types';
import { homeFor, type HomeContent } from '@/lib/homeContent';
import { popularFor, sectorsFor, tradesFor, type Trade } from '@/lib/trades';

export function useHomeContent(): HomeContent {
  const { language } = useLanguage();
  return homeFor(language);
}

export function useTrades(): { trades: Trade[]; popular: Trade[]; sectors: string[]; language: Language } {
  const { language } = useLanguage();

  return {
    language,
    trades: tradesFor(language),
    popular: popularFor(language),
    sectors: sectorsFor(language),
  };
}
