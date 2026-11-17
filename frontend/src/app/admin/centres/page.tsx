'use client';

import Link from 'next/link';
import { RecruitmentCenters } from '@/components/RecruitmentCenters';

export default function AdminCentresPage() {
  return (
    <div className="mx-auto grid grid-cols-1 max-w-5xl gap-4 sm:p-6">
      <div className="flex justify-end"><Link href="/amud/centre/planning" className="inline-flex min-h-[44px] items-center rounded-lg border border-current px-4 text-sm font-semibold">Emploi du temps et salles →</Link></div>
      <RecruitmentCenters />
    </div>
  );
}
