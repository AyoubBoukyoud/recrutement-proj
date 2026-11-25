'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { DashboardWorkspace } from '@/components/amud/centre/training/DashboardWorkspace';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyDashboardPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyDashboardPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyDashboardPage /> : <DashboardWorkspace />;
}
