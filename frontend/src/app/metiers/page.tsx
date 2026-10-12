import type { Metadata } from 'next';
import { SharedPublicFooter, SharedPublicHeader } from '@/components/reference-landing/SharedPublicChrome';
import { TradesIndex } from '@/components/home/TradesIndex';
import { LocalizedTitle } from '@/components/seo/LocalizedTitle';
import { pageMetadata } from '@/lib/seo';

export const metadata: Metadata = pageMetadata({
  title: 'Les métiers qui recrutent en Allemagne — Amud Skills',
  description:
    'Santé, industrie, bâtiment, hôtellerie, informatique, transport : le niveau d’allemand, le diplôme et les documents attendus pour chaque métier.',
  path: '/metiers',
});

export default function TradesPage() {
  return (
    <>
      <LocalizedTitle
        titles={{
          fr: 'Les métiers qui recrutent en Allemagne — Amud Skills',
          ar: 'المهن المطلوبة في ألمانيا — Amud Skills',
          de: 'Berufe mit Bedarf in Deutschland — Amud Skills',
          en: 'Trades hiring in Germany — Amud Skills',
        }}
      />
      <SharedPublicHeader />
      <main id="main-content" tabIndex={-1} className="pt-2 outline-none lg:pt-6">
        <TradesIndex />
      </main>
      <SharedPublicFooter />
    </>
  );
}
