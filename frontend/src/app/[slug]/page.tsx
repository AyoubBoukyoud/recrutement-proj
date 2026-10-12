import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { SeoLandingPage, TrustContentPage } from '@/components/seo/SeoLandingPage';
import { SEO_PAGES, TRUST_PAGES, getSeoPage } from '@/lib/seoPages';
import { SITE_URL } from '@/lib/site';

export const dynamicParams = false;

export function generateStaticParams() {
  return [...SEO_PAGES, ...TRUST_PAGES].map(({ slug }) => ({ slug }));
}

export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const { slug } = await params;
  const seo = getSeoPage(slug);
  const trust = TRUST_PAGES.find((page) => page.slug === slug);
  const page = seo ?? trust;
  if (!page) return {};
  return {
    title: page.title,
    description: page.description,
    alternates: {
      canonical: `/${slug}`,
      ...(slug === 'emploi-allemagne-maroc' ? { languages: {
        'fr-MA': `${SITE_URL}/emploi-allemagne-maroc`,
        'ar-MA': `${SITE_URL}/ar/travail-allemagne`,
        'x-default': `${SITE_URL}/emploi-allemagne-maroc`,
      } } : {}),
    },
    openGraph: { title: page.title, description: page.description, url: `/${slug}`, siteName: 'Amud Skills', type: 'article', locale: 'fr_MA' },
    twitter: { card: 'summary', title: page.title, description: page.description },
  };
}

export default async function SeoRoute({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const seo = getSeoPage(slug);
  if (seo) return <SeoLandingPage page={seo} />;
  const trust = TRUST_PAGES.find((page) => page.slug === slug);
  if (!trust) notFound();
  return <TrustContentPage page={trust} />;
}
