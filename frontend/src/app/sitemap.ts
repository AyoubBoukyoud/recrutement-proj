import type { MetadataRoute } from 'next';
import { allSlugs } from '@/lib/trades';
import { LEGAL_PATHS } from '@/content/legal';
import { SITE_URL } from '@/lib/site';
import { SEO_PATHS, TRUST_PAGES } from '@/lib/seoPages';

/** Les pages publiques, celles que Search Console doit connaître. */
const PUBLIC_PAGES = [
  '/', '/entreprises', '/employeurs', '/crm-centre-formation', '/produit',
  '/notre-entreprise', '/notre-entreprise/startup', '/metiers', ...SEO_PATHS,
  ...TRUST_PAGES.map(({ slug }) => `/${slug}`),
  '/ar/travail-allemagne', '/de/fachkraefte-aus-marokko',
  ...Object.values(LEGAL_PATHS),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_PAGES.map((path) => ({
      url: `${SITE_URL}${path}`,
      lastModified: new Date(),
      ...(path === '/emploi-allemagne-maroc' || path === '/ar/travail-allemagne' ? {
        alternates: { languages: {
          'fr-MA': `${SITE_URL}/emploi-allemagne-maroc`,
          'ar-MA': `${SITE_URL}/ar/travail-allemagne`,
          'x-default': `${SITE_URL}/emploi-allemagne-maroc`,
        } },
      } : {}),
    })),
    ...allSlugs().map((slug) => ({ url: `${SITE_URL}/metiers/${slug}`, lastModified: new Date() })),
  ];
}
