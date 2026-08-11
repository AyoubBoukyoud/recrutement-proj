import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { TradeDetail } from '@/components/home/TradeDetail';
import { allSlugs, findTrade } from '@/lib/trades';

/**
 * Fiche métier — la destination de la recherche de la page d'accueil.
 *
 * Ce n'est pas une liste d'offres : il n'en existe pas dans ce produit. C'est
 * la réponse aux questions qu'un candidat se pose réellement avant de se
 * lancer — quel niveau d'allemand, quel diplôme, que mettre dans le dossier —
 * et le point d'entrée vers la création du dossier.
 *
 * La page reste rendue côté serveur pour ses métadonnées ; le corps traduit
 * vit dans `TradeDetail`, la langue n'étant connue que du navigateur.
 */

export function generateStaticParams() {
  return allSlugs().map((slug) => ({ slug }));
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  // Les métadonnées sont produites au build, donc en français : c'est la langue
  // de référence du contenu, et la seule connue hors du navigateur.
  const trade = findTrade(params.slug);
  if (!trade) return { title: 'Métier introuvable' };

  return {
    title: `${trade.label} en Allemagne — Amud Skills`,
    description: trade.summary,
  };
}

export default function TradePage({ params }: { params: { slug: string } }) {
  if (!findTrade(params.slug)) notFound();

  return (
    <>
      <SiteHeader />

      <main className="pt-28 lg:pt-36">
        <TradeDetail slug={params.slug} />
      </main>

      <SiteFooter />
    </>
  );
}
