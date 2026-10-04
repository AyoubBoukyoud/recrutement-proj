import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
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

type TradePageParams = Promise<{ slug: string }>;

export async function generateMetadata({ params }: { params: TradePageParams }): Promise<Metadata> {
  // Les métadonnées sont produites au build, donc en français : c'est la langue
  // de référence du contenu, et la seule connue hors du navigateur.
  const { slug } = await params;
  const trade = findTrade(slug);
  if (!trade) return { title: 'Métier introuvable' };

  return {
    title: `${trade.label} en Allemagne — Amud Skills`,
    description: trade.summary,
    alternates: { canonical: `/metiers/${slug}` },
  };
}

export default async function TradePage({ params }: { params: TradePageParams }) {
  const { slug } = await params;
  if (!findTrade(slug)) notFound();

  return (
    <>
      <SharedPublicHeader />
      <main id="main-content" tabIndex={-1} className="pt-2 outline-none lg:pt-6">
        <TradeDetail slug={slug} />
      </main>

      <SharedPublicFooter />
    </>
  );
}
