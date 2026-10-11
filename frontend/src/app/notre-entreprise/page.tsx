import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';

export const metadata: Metadata = {
  title: 'AMUD Skills — Startup marocaine de solutions numériques',
  description: 'Fondée le 10 septembre 2023, AMUD Skills développe des applications, des solutions d’ingénierie numérique et de formation technologique.',
  alternates: { canonical: '/notre-entreprise' },
};

export default function CompanyPage() {
  return <PublicMarketingLanding kind="company"/>;
}
