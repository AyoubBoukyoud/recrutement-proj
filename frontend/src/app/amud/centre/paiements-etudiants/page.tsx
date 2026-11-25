'use client';

import dynamic from 'next/dynamic';
import { LoadingState } from '@/components/amud/ui';
import { PaymentsWorkspace } from '@/components/amud/centre/training/PaymentsWorkspace';
import { useTrainingDemo } from '@/lib/amud/useTrainingDemo';

// The browser demo keeps the prototype page; it is only downloaded when demo mode is on.
const LegacyPaymentsPage = dynamic(() => import('@/components/amud/centre/legacy/LegacyPaymentsPage'), { loading: () => <LoadingState /> });

export default function Page() {
  return useTrainingDemo() ? <LegacyPaymentsPage /> : <PaymentsWorkspace />;
}
