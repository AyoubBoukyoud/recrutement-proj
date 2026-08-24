import { ReactNode } from 'react';
import { StudentShell } from '@/components/amud/StudentShell';

export default function StudentLayout({ children }: { children: ReactNode }) {
  return <StudentShell>{children}</StudentShell>;
}
