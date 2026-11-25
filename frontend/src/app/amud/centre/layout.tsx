'use client';

import { ReactNode } from 'react';
import { CentreShell } from '@/components/amud/CentreShell';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { TimetableScopeProvider, useTimetableScope } from '@/lib/amud/timetable/useTimetable';

/** Prototype pages keep their warning; API-backed pages do not show it. */
function PrototypeBanner() {
  return useTimetableScope().enabled ? null : <DemoBanner />;
}

export default function CentreLayout({ children }: { children: ReactNode }) {
  return <TimetableScopeProvider><CentreShell><PrototypeBanner />{children}</CentreShell></TimetableScopeProvider>;
}
