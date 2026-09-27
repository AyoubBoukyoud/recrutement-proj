'use client';

import { RecruitmentCenters } from '@/components/RecruitmentCenters';

export default function AdminCentresPage() {
  return (
    <div className="mx-auto grid grid-cols-1 max-w-5xl gap-4 sm:p-6">
      <RecruitmentCenters />
    </div>
  );
}
