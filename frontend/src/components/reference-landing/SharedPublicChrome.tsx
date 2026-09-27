'use client';

import { useLanguage } from '@/context/LanguageContext';
import { PublicSiteFooter, PublicSiteHeader } from './PublicSiteChrome';

/*
 * L'en-tête et le pied de la page d'accueil, pour les autres pages publiques
 * (`/employeurs`, `/produit`, `/metiers/[slug]`). Elles avaient leur propre
 * chrome (`components/home/SiteHeader`) avec d'autres libellés et d'autres
 * liens : la navigation changeait d'une page publique à l'autre. La langue
 * n'est connue que du navigateur, d'où ce composant client.
 */
export function SharedPublicHeader() {
  const { language } = useLanguage();
  return (
    <div className="reference-home reference-chrome" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <PublicSiteHeader locale={language} />
    </div>
  );
}

export function SharedPublicFooter() {
  const { language } = useLanguage();
  return (
    <div className="reference-home reference-chrome" dir={language === 'ar' ? 'rtl' : 'ltr'} lang={language}>
      <PublicSiteFooter locale={language} />
    </div>
  );
}
