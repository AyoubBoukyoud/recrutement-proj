'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingState, PageHeader, ReadOnlyNotice } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, THEMES, type Centre } from '@/data/amud/centres';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTarifsCollection } from '@/lib/amud/localCenterTarifs';
import { centerTarifsSeed } from '@/data/amud/centerTarifs';
import { PublicSiteRenderer } from '@/components/amud/centre/PublicSiteRenderer';
import { ThemePreviewCard } from '@/components/amud/centre/ThemePreviewCard';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

/**
 * Route dédiée `/amud/centre/site/themes` (cahier des charges §16) —
 * sélection de thème avec aperçu en direct, séparée de l'édition de
 * contenu de `/amud/centre/site` (qui garde son propre sélecteur pour un
 * choix rapide sans changer de page ; les deux écrivent le même
 * `centre.theme`, donc toujours en phase).
 */
export default function CentreSiteThemesPage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-site');
  const [centres, { update }] = useCollection(centresCollection, centresSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [tarifs] = useCollection(centerTarifsCollection, centerTarifsSeed);
  const centre = centres.find((c) => c.id === centerId);

  const [previewTheme, setPreviewTheme] = useState<Centre['theme'] | null>(null);

  useEffect(() => {
    if (centre) setPreviewTheme(centre.theme);
  }, [centre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!centre || !previewTheme) {
    return <LoadingState label="Chargement des thèmes…" />;
  }

  function handleApply(themeId: Centre['theme']) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    if (!centre) return;
    update(centre.id, { theme: themeId, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: 'Changement de thème', actionType: 'update', module: 'Centres de formation — Site', reference: `${centre.nom} (#${centre.id})`, centerId });
    logCenterActivity({ centerId, type: 'THEME_CHANGED', message: `Thème changé pour « ${THEMES.find((t) => t.id === themeId)?.nom ?? themeId} ».`, utilisateur: 'Centre (self-service)', role });
    notify('Thème appliqué, visible immédiatement sur le site public.');
  }

  const centerFormations = formations.filter((f) => f.centerId === centerId && f.statut === 'Active');
  const centerTarifs = tarifs.filter((t) => t.centerId === centerId);

  return (
    <div className="space-y-lg">
      <PageHeader title="Thèmes du site public" subtitle="Choisissez une identité visuelle complète — navigation, hero, cartes, typographie et pied de page changent tous ensemble.">
        <Link href="/amud/centre/site" className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined text-[18px]">arrow_back</span>
          Retour au contenu du site
        </Link>
      </PageHeader>

      {!allowed ? <ReadOnlyNotice>Votre rôle actuel ne permet pas de changer le thème — lecture seule.</ReadOnlyNotice> : null}

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)]">
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
          {THEMES.map((t) => (
            <ThemePreviewCard
              key={t.id}
              theme={t.id}
              selected={previewTheme === t.id}
              disabled={!allowed}
              onSelect={() => setPreviewTheme(t.id)}
            />
          ))}
        </div>
        <div className="xl:sticky xl:top-4 xl:self-start">
          <div className="mb-sm flex items-center justify-between">
            <p className="text-label-md font-semibold text-amud-on-surface-variant">Aperçu — {THEMES.find((t) => t.id === previewTheme)?.nom}</p>
            {allowed && previewTheme !== centre.theme ? (
              <button onClick={() => handleApply(previewTheme)} className="min-h-[44px] rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm hover:brightness-110">
                Appliquer ce thème
              </button>
            ) : null}
          </div>
          <div className="max-h-[80vh] overflow-y-auto rounded-xl border border-amud-outline-variant shadow-sm">
            <PublicSiteRenderer centre={{ ...centre, theme: previewTheme }} formations={centerFormations} tarifs={centerTarifs} compact />
          </div>
        </div>
      </div>
    </div>
  );
}
