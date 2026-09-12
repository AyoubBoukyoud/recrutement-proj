import { CompanyShell } from '@/components/amud/CompanyShell';

export default function AmudEntrepriseLayout({ children }: { children: React.ReactNode }) {
  return <CompanyShell>{children}</CompanyShell>;
}
