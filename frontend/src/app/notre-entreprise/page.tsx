import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';
import { OrganizationJsonLd } from '@/components/seo/OrganizationJsonLd';

export const metadata: Metadata = {
  title: 'Notre entreprise — AMUD Skills',
  description: 'AMUD Skills relie les talents du Maroc aux employeurs en Allemagne. Nous réalisons aussi sites web, applications, jeux éducatifs et formations pour les entreprises.',
  alternates: { canonical: '/notre-entreprise' },
};

export default function CompanyPage() {
  return <><OrganizationJsonLd /><PublicMarketingLanding kind="company"/></>;
}
