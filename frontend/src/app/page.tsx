import type { Metadata } from 'next';
import { PublicHome } from '@/components/home/PublicHome';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';

/**
 * La page d'accueil publique vit à la racine. L'ancienne adresse
 * `/accueil-public` y redirige de façon permanente (next.config.mjs), pour
 * que liens partagés et pages déjà indexées aboutissent ici.
 */
export const metadata: Metadata = {
  title: 'Emploi en Allemagne pour Marocains | Offres & Contrats – Amud Skills',
  description: 'Trouvez des opportunités d’emploi en Allemagne selon votre métier, votre expérience et votre niveau d’allemand. Créez gratuitement votre profil Amud Skills.',
  alternates: { canonical: '/' },
  openGraph: {
    title: 'Emploi en Allemagne pour Marocains | Amud Skills',
    description: 'Des opportunités professionnelles selon votre métier, votre expérience et votre niveau d’allemand.',
    url: '/', siteName: 'Amud Skills', locale: 'fr_MA', type: 'website',
  },
  twitter: { card: 'summary_large_image', title: 'Emploi en Allemagne pour Marocains | Amud Skills', description: 'Des opportunités professionnelles adaptées à votre profil.' },
};

export default function HomePage() {
  const website = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': 'https://amudskills.com/#website', name: 'Amud Skills',
    url: 'https://amudskills.com/', inLanguage: ['fr-MA', 'ar-MA', 'de-DE', 'en'],
  };
  return <><OrganizationJsonLd /><script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, '\\u003c') }}/><PublicHome /></>;
}
