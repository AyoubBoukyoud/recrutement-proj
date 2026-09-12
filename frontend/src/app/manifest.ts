import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Amud Skills - Plateforme de recrutement',
    short_name: 'Amud Skills',
    description: 'Plateforme de recrutement transcontinental Maroc - Allemagne',
    start_url: '/',
    scope: '/',
    display: 'standalone',
    orientation: 'portrait-primary',
    background_color: process.env.NEXT_PUBLIC_BRAND_SURFACE!,
    theme_color: process.env.NEXT_PUBLIC_BRAND_PRIMARY!,
    lang: 'fr',
    dir: 'ltr',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      {
        src: '/icons/icon-maskable-512x512.png',
        sizes: '512x512',
        type: 'image/png',
        purpose: 'maskable',
      },
    ],
  };
}
