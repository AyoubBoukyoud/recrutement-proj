import type { Metadata } from 'next';
import { PublicHome } from '@/components/home/PublicHome';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

/**
 * La page d'accueil publique vit à la racine. L'ancienne adresse
 * `/accueil-public` y redirige de façon permanente (next.config.mjs), pour
 * que liens partagés et pages déjà indexées aboutissent ici.
 */
export const metadata: Metadata = pageMetadata({
  title: 'Emploi en Allemagne pour Marocains | Offres & Contrats – Amud Skills',
  description: 'Trouvez des opportunités d’emploi en Allemagne selon votre métier, votre expérience et votre niveau d’allemand. Créez gratuitement votre profil Amud Skills.',
  path: '/',
  socialTitle: 'Emploi en Allemagne pour Marocains | Amud Skills',
  socialDescription: 'Des opportunités professionnelles selon votre métier, votre expérience et votre niveau d’allemand.',
});

export default function HomePage() {
  const website = {
    '@context': 'https://schema.org', '@type': 'WebSite',
    '@id': 'https://amudskills.com/#website', name: 'Amud Skills',
    url: 'https://amudskills.com/', inLanguage: ['fr-MA', 'ar-MA', 'de-DE', 'en'],
  };
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'Emploi en Allemagne pour Marocains | Offres & Contrats – Amud Skills',
          ar: 'العمل في ألمانيا للمغاربة | عروض وعقود – Amud Skills',
          de: 'Jobs in Deutschland für Marokkaner | Angebote & Verträge – Amud Skills',
          en: 'Jobs in Germany for Moroccans | Offers & Contracts – Amud Skills',
        }}
      />
      <OrganizationJsonLd />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(website).replace(/</g, '\\u003c') }}/>
      <PublicHome />
    </>
  );
}
