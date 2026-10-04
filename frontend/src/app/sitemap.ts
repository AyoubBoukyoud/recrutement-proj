import type { MetadataRoute } from 'next';
import { allSlugs } from '@/lib/trades';
import { SITE_URL } from '@/lib/site';

/** Les pages publiques, celles que Search Console doit connaître. */
const PUBLIC_PAGES = ['/', '/entreprises', '/employeurs', '/crm-centre-formation', '/produit'];

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    ...PUBLIC_PAGES.map((path) => ({ url: `${SITE_URL}${path}` })),
    ...allSlugs().map((slug) => ({ url: `${SITE_URL}/metiers/${slug}` })),
  ];
}
