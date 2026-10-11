import type { Metadata } from 'next';
import { PublicMarketingLanding } from '@/components/reference-landing/PublicMarketingLanding';

export const metadata: Metadata = {
  title: 'AMUD Skills — Profil de la startup et équipe dirigeante',
  description: 'Découvrez la date de création, les dirigeants et les objectifs de la startup marocaine AMUD Skills.',
  alternates: { canonical: '/notre-entreprise/startup' },
};

export default function StartupProfileRoute() {
  return <PublicMarketingLanding kind="startup"/>;
}
