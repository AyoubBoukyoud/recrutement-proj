import type { Metadata } from 'next';
import { SiteHeader } from '@/components/home/SiteHeader';
import { SiteFooter } from '@/components/home/SiteFooter';
import { EmployeursBody } from './EmployeursBody';

export const metadata: Metadata = {
  title: 'Recrutez au Maroc — Amud Skills',
  description:
    'Réduisez vos délais de vacance de poste grâce à des professionnels marocains vérifiés, formés aux standards CECR allemands et entièrement conformes au RGPD.',
};

/**
 * `/employeurs` — page publique employeurs, confiance & conformité.
 *
 * Contenu porté depuis la maquette "Trust & Compliance" (voir
 * `/amud/marketing/employers` pour la version isolée d'origine). `SiteHeader`
 * / `SiteFooter` réels ; le corps traduit vit dans `EmployeursBody` (même
 * raison que `ProductHome`/`TradeDetail` : la langue n'est connue que du
 * navigateur), qui inclut le calculateur ROI (`RoiCalculatorForm`).
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
