'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTarifsCollection } from '@/lib/amud/localCenterTarifs';
import { centerTarifsSeed } from '@/data/amud/centerTarifs';
import { PublicSiteRenderer } from '@/components/amud/centre/PublicSiteRenderer';

/**
 * Site public d'un centre (cahier des charges §32-42) — jusqu'ici cette
 * route n'existait pas du tout (le lien "Voir le site public" côté Admin
 * pointait dans le vide, cf. audit). Lecture seule, sans navigation
 * `/amud/*` autour : c'est la page qu'un visiteur externe verrait.
 */
export default function CentrePublicSitePage() {
  const params = useParams<{ slug: string }>();
  const [centres] = useCollection(centresCollection, centresSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [tarifs] = useCollection(centerTarifsCollection, centerTarifsSeed);

  const centre = centres.find((c) => c.slug === params.slug);

  if (!centre || !centre.site.enabled) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-md bg-amud-background px-6 text-center text-amud-on-surface">
        <span className="material-symbols-outlined text-[48px] text-amud-on-surface-variant">search_off</span>
        <h1 className="text-title-lg">Site indisponible</h1>
        <p className="max-w-sm text-body-md text-amud-on-surface-variant">
          {centre ? 'Le site public de ce centre est actuellement désactivé.' : "Ce centre n'existe pas."}
        </p>
        <Link href="/amud" className="text-label-md text-amud-primary hover:underline">Retour à l’accueil</Link>
      </div>
    );
  }

  const centerFormations = formations.filter((f) => f.centerId === centre.id && f.statut === 'Active');
  const centerTarifs = tarifs.filter((t) => t.centerId === centre.id);

  return (
    <div>
      <div className="px-4 pt-4">
        <DemoBanner />
      </div>
      <PublicSiteRenderer centre={centre} formations={centerFormations} tarifs={centerTarifs} />
    </div>
  );
}
