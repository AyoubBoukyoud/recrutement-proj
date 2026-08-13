import { Suspense } from 'react';
import { CandidatesPanel } from '@/components/admin/CandidatesPanel';

/**
 * Route `/admin/candidats`. Ouvrir un dossier navigue vers `/admin/candidats/:id`
 * — voir `CandidatesPanel`, qui gère cette navigation directement.
 *
 * `CandidatesPanel` lit `useSearchParams()` (pour `?status=`), ce qui exige
 * une frontière `<Suspense>` autour de l'appelant pour que Next puisse
 * pré-rendre statiquement le reste de la page — même motif que /otp.
 */
export default function AdminCandidatesPage() {
  return (
    <Suspense fallback={null}>
      <CandidatesPanel />
    </Suspense>
  );
}
