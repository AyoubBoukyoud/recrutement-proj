'use client';

import { useRouter } from 'next/navigation';
import { AdminCandidateDetail } from '@/components/admin/AdminCandidateDetail';

/**
 * Route `/admin/candidats/:id`. Le composant qui porte cet écran prend `id`
 * et `onBack` en props — cette page ne fait que les lui fournir depuis le
 * routeur :
 *
 *   - `id` vient du segment dynamique, donc actualiser la page ou la
 *     partager rouvre le même dossier ;
 *   - `onBack` navigue vers la liste plutôt que de fermer un panneau, donc le
 *     bouton retour du navigateur redevient l'historique réel du navigateur.
 *
 * Cette page est un composant client (plutôt qu'un composant serveur qui
 * passerait `params` directement au panneau) parce qu'elle a besoin de
 * `useRouter()` pour construire `onBack` — une fonction ne peut pas
 * traverser la frontière serveur/client comme prop.
 */
export default function AdminCandidateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();

  return <AdminCandidateDetail id={Number(params.id)} onBack={() => router.push('/admin/candidats')} />;
}
