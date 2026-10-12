import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Recruter des talents au Maroc — AMUD Skills',
  description: 'Découvrez des profils structurés avec CV, expériences, diplômes et présentation vidéo en allemand.',
  path: '/entreprises',
});

export default function EmployersPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'Recruter des talents au Maroc — AMUD Skills',
          ar: 'توظيف المواهب في المغرب — AMUD Skills',
          de: 'Talente in Marokko rekrutieren — AMUD Skills',
          en: 'Hire talent in Morocco — AMUD Skills',
        }}
      />
      <PublicMarketingLanding kind="employers"/>
    </>
  );
}
