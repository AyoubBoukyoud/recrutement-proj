import { ReactNode } from 'react';
import { TeacherShell } from '@/components/amud/TeacherShell';

export default function TeacherLayout({ children }: { children: ReactNode }) {
  return <TeacherShell>{children}</TeacherShell>;
}
