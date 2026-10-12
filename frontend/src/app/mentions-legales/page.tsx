import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { LegalPage } from '@/components/legal/LegalPage';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { LEGAL, LEGAL_PATHS } from '@/content/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Mentions légales — AMUD Skills',
  description: 'Éditeur, hébergeur et informations légales du site amudskills.com.',
  path: LEGAL_PATHS.notice,
});

export default function LegalNoticePage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: `${LEGAL.fr.notice.title} — AMUD Skills`,
          ar: `${LEGAL.ar.notice.title} — AMUD Skills`,
          de: `${LEGAL.de.notice.title} — AMUD Skills`,
          en: `${LEGAL.en.notice.title} — AMUD Skills`,
        }}
      />
      <SharedPublicHeader />
      <main id="main-content" tabIndex={-1} className="pt-2 outline-none lg:pt-6">
        <LegalPage docKey="notice" />
      </main>
      <SharedPublicFooter />
    </>
  );
}
