import { ReactNode } from 'react';
import { CentreShell } from '@/components/amud/CentreShell';

export default function CentreLayout({ children }: { children: ReactNode }) {
  return <CentreShell>{children}</CentreShell>;
}
