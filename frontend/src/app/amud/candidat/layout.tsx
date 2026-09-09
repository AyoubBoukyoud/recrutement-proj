import { ReactNode } from 'react';
import { CandidatShell } from '@/components/amud/CandidatShell';

export default function CandidatLayout({ children }: { children: ReactNode }) {
  return <CandidatShell>{children}</CandidatShell>;
}
