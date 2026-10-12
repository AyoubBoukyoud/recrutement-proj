import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { LegalPage } from '@/components/legal/LegalPage';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { LEGAL, LEGAL_PATHS } from '@/content/legal';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Conditions d’utilisation — AMUD Skills',
  description: 'Les règles d’utilisation du site et de l’application AMUD Skills, pour les candidats et les recruteurs.',
  path: LEGAL_PATHS.terms,
});

export default function TermsPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: `${LEGAL.fr.terms.title} — AMUD Skills`,
          ar: `${LEGAL.ar.terms.title} — AMUD Skills`,
          de: `${LEGAL.de.terms.title} — AMUD Skills`,
          en: `${LEGAL.en.terms.title} — AMUD Skills`,
        }}
      />
      <SharedPublicHeader />
      <main id="main-content" tabIndex={-1} className="pt-2 outline-none lg:pt-6">
        <LegalPage docKey="terms" />
      </main>
      <SharedPublicFooter />
    </>
  );
}
