import { Link } from 'react-router-dom'
import { Card, SectionHeader } from '../../components/ui'

/** Route de repli pour tout `/admin/*` inconnu — une page vide n'indique pas
 *  à l'admin qu'il s'est trompé de chemin, celle-ci le fait. */
export function AdminNotFound() {
  return (
    <Card>
      <SectionHeader eyebrow="404" title="Section introuvable" />
      <p className="helper-text">
        Cette adresse ne correspond à aucune section de la console. Vérifiez le lien, ou repartez de l&apos;aperçu.
      </p>
      <Link to="/admin/apercu" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← Retour à l&apos;aperçu
      </Link>
    </Card>
  )
}
