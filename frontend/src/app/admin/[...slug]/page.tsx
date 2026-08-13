import Link from 'next/link';
import { Card, SectionHeader } from '@/components/ui';

/**
 * Filet de repli pour tout `/admin/*` inconnu — un segment attrape-tout
 * (`[...slug]`) plutôt que le mécanisme `not-found.tsx` de Next, pour rester
 * sous `AdminLayout` : l'admin voit toujours le bandeau et la navigation,
 * pas une page blanche hors du gabarit de la console.
 */
export default function AdminCatchAllPage() {
  return (
    <Card>
      <SectionHeader eyebrow="404" title="Section introuvable" />
      <p className="helper-text">
        Cette adresse ne correspond à aucune section de la console. Vérifiez le lien, ou repartez de l&apos;aperçu.
      </p>
      <Link href="/admin/apercu" className="mt-4 inline-block text-sm font-semibold text-primary hover:underline">
        ← Retour à l&apos;aperçu
      </Link>
    </Card>
  );
}
