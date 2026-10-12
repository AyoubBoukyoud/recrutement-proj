import type { Metadata } from 'next';

/**
 * L'aperçu qu'affichent WhatsApp, Facebook et LinkedIn quand on partage un
 * lien : 1200×630, la scène du hero et le logo.
 */
const OG_IMAGE = {
  url: '/landing-assets/og-image.jpg',
  width: 1200,
  height: 630,
  alt: 'AMUD Skills — du Maroc vers l’Allemagne',
};

/**
 * Les métadonnées d'une page publique. Next fusionne celles des segments
 * *superficiellement* : dès qu'une page déclare `openGraph`, celui du layout
 * est remplacé en bloc. Chaque page passe donc par ici pour que titre,
 * description, URL canonique et aperçu social restent d'un seul tenant.
 */
export function pageMetadata({
  title,
  description,
  path,
}: {
  title: string;
  description: string;
  path: string;
}): Metadata {
  return {
    title,
    description,
    alternates: { canonical: path },
    openGraph: {
      type: 'website',
      siteName: 'AMUD Skills',
      locale: 'fr_FR',
      url: path,
      title,
      description,
      images: [OG_IMAGE],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [OG_IMAGE.url],
    },
  };
}

/** Repli de `app/layout.tsx` pour les pages qui ne déclarent rien. */
export const DEFAULT_SOCIAL: Pick<Metadata, 'openGraph' | 'twitter'> = {
  openGraph: {
    type: 'website',
    siteName: 'AMUD Skills',
    locale: 'fr_FR',
    images: [OG_IMAGE],
  },
  twitter: { card: 'summary_large_image', images: [OG_IMAGE.url] },
};
