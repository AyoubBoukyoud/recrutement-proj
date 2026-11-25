'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { StudentsWorkspace } from '@/components/amud/centre/training/StudentsWorkspace';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyStudentsPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyStudentsPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyStudentsPage /> : <StudentsWorkspace />;
}
