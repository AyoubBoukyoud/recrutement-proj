import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { PublicHome } from '@/components/home/PublicHome';

export const metadata: Metadata = {
  title: 'Dossier candidat et recrutement — Amud Skills',
  description:
    "Créez un dossier professionnel structuré et choisissez s’il peut être consulté par des recruteurs autorisés.",
};

/**
 * Page d'accueil publique canonique. `SiteHeader` / `SiteFooter` sont
 * partagés avec `/metiers/[slug]`; le corps traduit vit dans `PublicHome`
 * car la langue est connue côté navigateur.
 */
export default function AccueilPublicPage() {
  return (
    <div className="home-font-pairing">
      <SiteHeader glassTransparent />

      <PublicHome />

      <SiteFooter />
    </div>
  );
}
