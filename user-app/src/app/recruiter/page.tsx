'use client';

// Espace recruteur — porté depuis web-admin (RecruiterSearch), branché sur
// la même API que le reste du site. Protégé par middleware.ts (rôle "Company").

import { DashboardShell } from '@/dashboard/DashboardShell';
import RecruiterSearch from '@/dashboard/pages/RecruiterSearch';

export default function RecruiterPage() {
  return (
    <DashboardShell>
      <RecruiterSearch />
    </DashboardShell>
  );
}
