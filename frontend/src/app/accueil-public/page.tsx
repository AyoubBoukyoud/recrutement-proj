import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { ProductHome } from '@/components/home/ProductHome';

export const metadata: Metadata = {
  title: 'Matching en temps réel — Amud Skills',
  description:
    "Une expérience de mise en relation fluide entre professionnels marocains et opportunités allemandes. Mobile d'abord, gratuit pour les candidats.",
};

/**
 * Page d'accueil publique réelle de l'app (contenu identique à l'ancienne
 * route `/`, déplacé ici quand `/amud` est devenu la page d'accueil — cf.
 * `app/page.tsx` qui redirige désormais vers `/amud`). `SiteHeader` /
 * `SiteFooter` restent les composants réels — partagés avec
 * `/metiers/[slug]`. Le corps traduit vit dans `ProductHome` (même raison
 * que `TradeDetail` : la langue n'est connue que du navigateur).
 */
export default function AccueilPublicPage() {
  return (
    <div className="home-font-pairing">
      <SiteHeader />

      <ProductHome />

      <SiteFooter />
    </div>
  );
}
