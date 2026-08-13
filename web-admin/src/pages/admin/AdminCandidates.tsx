import { CandidatesPanel } from '../../components/admin/CandidatesPanel'

/** Route `/admin/candidats`. Ouvrir un dossier navigue vers `:id` — voir
 *  `CandidatesPanel`, qui gère cette navigation directement. */
export function AdminCandidates() {
  return <CandidatesPanel />
}
