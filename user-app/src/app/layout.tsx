import type { Metadata, Viewport } from 'next';
import './globals.css';
import { Providers } from '@/components/shared/Providers';

export const metadata: Metadata = {
  title: 'Amud Skills Recruitment App',
  description: 'Plateforme de recrutement transcontinental Maroc - Allemagne',
  applicationName: 'Amud Skills',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'default',
    title: 'Amud Skills',
  },
  // `apple-mobile-web-app-capable`, seul, est déprécié et le navigateur le
  // signale en console. iOS s'appuie toujours dessus : on ajoute la balise
  // standard à côté plutôt que de retirer celle d'Apple.
  other: {
    'mobile-web-app-capable': 'yes',
  },
  icons: {
    icon: [
      { url: '/icons/icon-192x192.png', sizes: '192x192', type: 'image/png' },
      { url: '/icons/icon-512x512.png', sizes: '512x512', type: 'image/png' },
    ],
    apple: [{ url: '/icons/apple-touch-icon.png', sizes: '180x180', type: 'image/png' }],
  },
};

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#006266',
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fr">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className="min-h-screen bg-surface text-onSurface antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
