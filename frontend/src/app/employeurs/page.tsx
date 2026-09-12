import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { EmployeursBody } from './EmployeursBody';

export const metadata: Metadata = {
  title: 'Recrutez au Maroc — Amud Skills',
  description:
    'Découvrez comment Amud Skills permet aux recruteurs autorisés de publier des offres et de consulter des dossiers candidats avec leur consentement.',
};

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
      <SiteHeader />


      <EmployeursBody />
      <SiteFooter />
    </>
  );
}
