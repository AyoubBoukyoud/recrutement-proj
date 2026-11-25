'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { GroupsWorkspace } from '@/components/amud/centre/training/ResourceWorkspaces';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyGroupsPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyGroupsPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyGroupsPage /> : <GroupsWorkspace />;
}
