import { AdminShell } from '@/components/amud/AdminShell';

/** Coquille de toutes les pages `/amud/admin/*` — cf. AdminShell pour le détail. */
export default function AmudAdminLayout({ children }: { children: React.ReactNode }) {
  return <AdminShell>{children}</AdminShell>;
}
