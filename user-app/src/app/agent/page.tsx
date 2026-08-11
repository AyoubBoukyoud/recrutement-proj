'use client';

// Espace agent commercial — porté depuis web-admin (AgentDashboard), branché
// sur la même API que le reste du site. Protégé par middleware.ts (rôle "Commercial Agent").

import { DashboardShell } from '@/dashboard/DashboardShell';
import AgentDashboard from '@/dashboard/pages/AgentDashboard';

export default function AgentPage() {
  return (
    <DashboardShell>
      <AgentDashboard />
    </DashboardShell>
  );
}
