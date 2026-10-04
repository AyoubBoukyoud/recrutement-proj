import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';

export const metadata: Metadata = {
  title: 'Recruter des talents au Maroc — AMUD Skills',
  description: 'Découvrez des profils structurés avec CV, expériences, diplômes et présentation vidéo en allemand.',
  alternates: { canonical: '/entreprises' },
};

export default function EmployersPage() {
  return <PublicMarketingLanding kind="employers"/>;
}
