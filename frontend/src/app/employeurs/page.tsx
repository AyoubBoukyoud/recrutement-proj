import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';
import { EmployeursBody } from './EmployeursBody';

export const metadata: Metadata = pageMetadata({
  title: 'Recrutez au Maroc — Amud Skills',
  description:
    'Découvrez comment Amud Skills permet aux recruteurs autorisés de publier des offres et de consulter des dossiers candidats avec leur consentement.',
  path: '/employeurs',
});

/**
 * `/employeurs` — page publique employeurs, confiance & conformité.
 *
 * La langue n'étant connue que du navigateur, le corps traduit vit dans
 * `EmployeursBody`. Les actions publiques renvoient uniquement vers des
 * parcours réellement implémentés.
 */
export default function EmployeursPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'Recrutez au Maroc — Amud Skills',
          ar: 'وظّفوا في المغرب — Amud Skills',
          de: 'Rekrutieren in Marokko — Amud Skills',
          en: 'Recruit in Morocco — Amud Skills',
        }}
      />
      <SharedPublicHeader />
      <EmployeursBody />
      <SharedPublicFooter />
    </>
  );
}
