import type { MetadataRoute } from 'next';
import { CANDIDATE_PATHS, STAFF_PREFIXES } from '@/lib/protectedRoutes';
import { SITE_URL } from '@/lib/site';

/**
 * Seules les pages publiques sont à explorer. Sans session, les espaces
 * connectés ne font que rediriger vers /auth-phone ; les écrans de transit
 * de la connexion et les maquettes n'ont rien à offrir à un moteur.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
      disallow: [
        ...CANDIDATE_PATHS,
        ...STAFF_PREFIXES,
        '/amud',
        '/dev',
        '/otp',
        '/auth-google',
        '/splash',
        '/language',
        '/offline',
        '/api/',
      ],
    },
    sitemap: `${SITE_URL}/sitemap.xml`,
  };
}
