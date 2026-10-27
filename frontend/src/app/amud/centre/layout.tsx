import { ReactNode } from 'react';
import { CentreShell } from '@/components/amud/CentreShell';
import { DemoBanner } from '@/components/amud/DemoBanner';

export default function CentreLayout({ children }: { children: ReactNode }) {
  return <CentreShell><DemoBanner />{children}</CentreShell>;
}
