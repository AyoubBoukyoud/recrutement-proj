import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Notre entreprise — AMUD Skills',
  description: 'AMUD Skills relie les talents du Maroc aux employeurs en Allemagne. Nous réalisons aussi sites web, applications, jeux éducatifs et formations pour les entreprises.',
  path: '/notre-entreprise',
});

export default function CompanyPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'Notre entreprise — AMUD Skills',
          ar: 'عن الشركة — AMUD Skills',
          de: 'Unser Unternehmen — AMUD Skills',
          en: 'Our company — AMUD Skills',
        }}
      />
      <OrganizationJsonLd />
      <PublicMarketingLanding kind="company"/>
    </>
  );
}
