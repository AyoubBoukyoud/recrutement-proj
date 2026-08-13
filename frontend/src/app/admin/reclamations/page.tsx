import { Suspense } from 'react';
import { ComplaintsPanel } from '@/components/admin/ComplaintsPanel';

/**
 * Route `/admin/reclamations`. `?status=` est géré par `ComplaintsPanel`
 * lui-même, l'URL faisant foi — d'où la frontière `<Suspense>` qu'exige
 * `useSearchParams()`, même motif que /admin/candidats et /otp.
 */
export default function AdminComplaintsPage() {
  return (
    <Suspense fallback={null}>
      <ComplaintsPanel />
    </Suspense>
  );
}
