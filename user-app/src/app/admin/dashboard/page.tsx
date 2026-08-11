'use client';

// Console admin — portée depuis web-admin (AdminDashboard), branchée sur la
// même API que le reste du site. Protégée par middleware.ts (rôle "Administrator").

import { DashboardShell } from '@/dashboard/DashboardShell';
import AdminDashboard from '@/dashboard/pages/AdminDashboard';

export default function AdminDashboardPage() {
  return (
    <DashboardShell>
      <AdminDashboard />
    </DashboardShell>
  );
}
