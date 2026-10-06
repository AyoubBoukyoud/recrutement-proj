import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';

export const metadata: Metadata = {
  title: 'Notre entreprise — AMUD Skills',
  description: 'Sites web, applications Android et iOS, ingénierie et infrastructures numériques, jeux éducatifs et formation continue avec un réseau de formateurs.',
};

export default function CompanyPage() {
  return <PublicMarketingLanding kind="company"/>;
}
