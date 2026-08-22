'use client';

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { AdminRecruiterDetail } from '@/components/admin/AdminRecruiterDetail';

/**
 * Route `/admin/recruteurs/:id`. Même structure que
 * `/admin/candidats/[id]/page.tsx`, dont c'est le miroir — voir ce fichier
 * pour le détail des choix (page client pour `useRouter()`, `<Suspense>`
 * pour `useSearchParams()` côté `AdminRecruiterDetail`).
 */
export default function AdminRecruiterDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return (
    <Suspense fallback={null}>
      <AdminRecruiterDetail id={Number(params.id)} onBack={() => router.push('/admin/recruteurs')} />
    </Suspense>
  );
}
