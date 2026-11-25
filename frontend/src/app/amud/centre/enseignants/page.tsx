'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { TeachersWorkspace } from '@/components/amud/centre/training/ResourceWorkspaces';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyTeachersPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyTeachersPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyTeachersPage /> : <TeachersWorkspace />;
}
