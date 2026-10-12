import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'CRM pour centres de formation — AMUD Skills',
  description: 'Organisez les cours, les groupes, les enseignants et le suivi des apprenants avec le CRM AMUD Skills.',
  path: '/crm-centre-formation',
});

export default function Page() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'CRM pour centres de formation — AMUD Skills',
          ar: 'نظام CRM لمراكز التكوين — AMUD Skills',
          de: 'CRM für Bildungszentren — AMUD Skills',
          en: 'CRM for training centres — AMUD Skills',
        }}
      />
      <PublicMarketingLanding kind="centre"/>
    </>
  );
}
