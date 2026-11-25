'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { FormationsWorkspace } from '@/components/amud/centre/training/ResourceWorkspaces';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyFormationsPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyFormationsPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyFormationsPage /> : <FormationsWorkspace />;
}
