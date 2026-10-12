'use client';

import { useEffect } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { findTrade } from '@/lib/trades';
import type { Language } from '@/lib/types';

/*
 * Le `<title>` produit par `metadata` est celui du build, donc en français :
 * la langue du visiteur n'est connue que du navigateur. Sans ce composant, un
 * visiteur qui lit la page en allemand ou en arabe garde un titre français
 * dans l'onglet, l'historique et ses favoris.
 */

function useDocumentTitle(title: string) {
  useEffect(() => {
    document.title = title;
  }, [title]);
}

export function LocalizedTitle({ titles }: { titles: Record<Language, string> }) {
  const { language } = useLanguage();
  useDocumentTitle(titles[language] ?? titles.fr);
  return null;
}

const TRADE_SUFFIX: Record<Language, string> = {
  fr: 'en Allemagne — Amud Skills',
  ar: 'في ألمانيا — Amud Skills',
  de: 'in Deutschland — Amud Skills',
  en: 'in Germany — Amud Skills',
};

/** Fiche métier : le libellé du métier est traduit, comme le corps de la page. */
export function LocalizedTradeTitle({ slug }: { slug: string }) {
  const { language } = useLanguage();
  const label = findTrade(slug, language)?.label ?? findTrade(slug)?.label ?? slug;
  useDocumentTitle(`${label} ${TRADE_SUFFIX[language] ?? TRADE_SUFFIX.fr}`);
  return null;
}
