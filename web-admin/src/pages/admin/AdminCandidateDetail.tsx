import { useNavigate, useParams } from 'react-router-dom'
import { AdminCandidateDetail as CandidateDetailPanel } from '../../components/admin/AdminCandidateDetail'

/**
 * Route `/admin/candidats/:id`. Le composant qui portait déjà cet écran
 * prenait `id` et `onBack` en props — cette page ne fait que les lui fournir
 * depuis le routeur au lieu d'un `useState` de parent :
 *
 *   - `id` vient de l'URL, donc actualiser la page ou la partager rouvre le
 *     même dossier ;
 *   - `onBack` navigue vers la liste plutôt que de fermer un panneau, donc le
 *     bouton retour du navigateur redevient l'historique réel du navigateur.
 */
export function AdminCandidateDetailPage() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()

  return <CandidateDetailPanel id={Number(id)} onBack={() => navigate('/admin/candidats')} />
}
