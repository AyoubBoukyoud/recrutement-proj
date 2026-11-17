'use client';

import { ReactNode } from 'react';
import { CentreShell } from '@/components/amud/CentreShell';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { usePathname } from 'next/navigation';
import { TimetableScopeProvider, isTimetablePath } from '@/lib/amud/timetable/useTimetable';

export default function CentreLayout({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return <TimetableScopeProvider><CentreShell>{!isTimetablePath(pathname) && <DemoBanner />}{children}</CentreShell></TimetableScopeProvider>;
}
