import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { LegalPage } from '@/components/legal/LegalPage';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { LEGAL, LEGAL_PATHS } from '@/content/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Politique de confidentialité — AMUD Skills',
  description: 'Les données que collecte AMUD Skills, pourquoi, avec qui elles sont partagées, et comment exercer vos droits (loi 09-08, RGPD).',
  path: LEGAL_PATHS.privacy,
});

export default function PrivacyPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: `${LEGAL.fr.privacy.title} — AMUD Skills`,
          ar: `${LEGAL.ar.privacy.title} — AMUD Skills`,
          de: `${LEGAL.de.privacy.title} — AMUD Skills`,
          en: `${LEGAL.en.privacy.title} — AMUD Skills`,
        }}
      />
      <SharedPublicHeader />
      <main id="main-content" tabIndex={-1} className="pt-2 outline-none lg:pt-6">
        <LegalPage docKey="privacy" />
      </main>
      <SharedPublicFooter />
    </>
  );
}
