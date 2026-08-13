import { ComplaintsPanel } from '../../components/admin/ComplaintsPanel'

/** Route `/admin/reclamations`. `?status=` est géré par `ComplaintsPanel`
 *  lui-même, l'URL faisant foi. */
export function AdminComplaints() {
  return <ComplaintsPanel />
}
