import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';
export const metadata: Metadata = {
  title: 'CRM pour centres de formation — AMUD Skills',
  description: 'Organisez les cours, les groupes, les enseignants et le suivi des apprenants avec le CRM AMUD Skills.',
};
export default function Page() { return <PublicMarketingLanding kind="centre"/>; }
