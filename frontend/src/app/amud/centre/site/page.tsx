'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LoadingState, PageHeader, ReadOnlyNotice, SegmentedControl, Toggle } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCenterAccess } from '@/lib/amud/useCenterAccess';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { logAudit } from '@/lib/amud/storage/audit';
import { logCenterActivity } from '@/lib/amud/localCenterActivities';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed, THEMES, type Centre, type CenterSiteContent, type CenterTestimonial, type CenterFaqItem } from '@/data/amud/centres';
import { centerFormationsCollection } from '@/lib/amud/localCenterFormations';
import { centerFormationsSeed } from '@/data/amud/centerFormations';
import { centerTarifsCollection } from '@/lib/amud/localCenterTarifs';
import { centerTarifsSeed } from '@/data/amud/centerTarifs';
import { PublicSiteRenderer } from '@/components/amud/centre/PublicSiteRenderer';
import { ThemePreviewCard } from '@/components/amud/centre/ThemePreviewCard';
import { PERMISSION_DENIED_MESSAGE } from '@/lib/amud/centerPermissions';

export default function CentreSitePage() {
  const notify = useToast();
  const { centerId, role, allowed } = useCenterAccess('manage-site');
  const [centres, { update }] = useCollection(centresCollection, centresSeed);
  const [formations] = useCollection(centerFormationsCollection, centerFormationsSeed);
  const [tarifs] = useCollection(centerTarifsCollection, centerTarifsSeed);
  const centre = centres.find((c) => c.id === centerId);

  const [theme, setTheme] = useState<Centre['theme']>('modern-education');
  const [site, setSite] = useState<CenterSiteContent | null>(null);
  /** Sur mobile l'édition et l'aperçu ne tiennent pas côte à côte : on bascule. */
  const [pane, setPane] = useState<'edition' | 'apercu'>('edition');
  /** Largeur simulée de l'aperçu, pour vérifier le rendu mobile sans quitter la page. */
  const [previewWidth, setPreviewWidth] = useState<'mobile' | 'desktop'>('desktop');

  useEffect(() => {
    if (!centre) return;
    setTheme(centre.theme);
    setSite(centre.site);
  }, [centre?.id]); // eslint-disable-line react-hooks/exhaustive-deps

  if (!centre || !site) {
    return <LoadingState label="Chargement du site public…" />;
  }

  function handleThemeChange(t: Centre['theme']) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    if (!centre) return;
    setTheme(t);
    update(centre.id, { theme: t, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: 'Changement de thème', actionType: 'update', module: 'Centres de formation — Site', reference: `${centre.nom} (#${centre.id})`, centerId });
    logCenterActivity({ centerId, type: 'THEME_CHANGED', message: `Thème changé pour « ${THEMES.find((th) => th.id === t)?.nom ?? t} ».`, utilisateur: 'Centre (self-service)', role });
    notify('Thème mis à jour.');
  }

  function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!allowed || !site) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    if (!centre) return;
    update(centre.id, { site, updatedAt: new Date().toISOString() });
    logAudit({ utilisateur: 'Centre (self-service)', role: 'Centre', action: 'Mise à jour contenu site public', actionType: 'update', module: 'Centres de formation — Site', reference: `${centre.nom} (#${centre.id})`, centerId });
    logCenterActivity({ centerId, type: 'WEBSITE_UPDATED', message: 'Contenu du site public mis à jour.', utilisateur: 'Centre (self-service)', role });
    notify('Contenu du site public enregistré.');
  }

  function toggleEnabled(enabled: boolean) {
    if (!allowed) return notify(PERMISSION_DENIED_MESSAGE, 'error');
    if (!site || !centre) return;
    const next = { ...site, enabled };
    setSite(next);
    update(centre.id, { site: next, updatedAt: new Date().toISOString() });
    logCenterActivity({ centerId, type: 'WEBSITE_UPDATED', message: enabled ? 'Site public activé.' : 'Site public désactivé.', utilisateur: 'Centre (self-service)', role });
    notify(enabled ? 'Site public activé.' : 'Site public désactivé.');
  }

  function updateAvantage(i: number, value: string) {
    if (!site) return;
    setSite({ ...site, avantages: site.avantages.map((a, idx) => (idx === i ? value : a)) });
  }
  function addAvantage() {
    if (!site) return;
    setSite({ ...site, avantages: [...site.avantages, ''] });
  }
  function removeAvantage(i: number) {
    if (!site) return;
    setSite({ ...site, avantages: site.avantages.filter((_, idx) => idx !== i) });
  }

  function updateTemoignage(i: number, patch: Partial<CenterTestimonial>) {
    if (!site) return;
    setSite({ ...site, temoignages: site.temoignages.map((tm, idx) => (idx === i ? { ...tm, ...patch } : tm)) });
  }
  function addTemoignage() {
    if (!site) return;
    setSite({ ...site, temoignages: [...site.temoignages, { nom: '', role: '', texte: '', note: 5 }] });
  }
  function removeTemoignage(i: number) {
    if (!site) return;
    setSite({ ...site, temoignages: site.temoignages.filter((_, idx) => idx !== i) });
  }

  function updateFaq(i: number, patch: Partial<CenterFaqItem>) {
    if (!site) return;
    setSite({ ...site, faq: site.faq.map((f, idx) => (idx === i ? { ...f, ...patch } : f)) });
  }
  function addFaq() {
    if (!site) return;
    setSite({ ...site, faq: [...site.faq, { question: '', reponse: '' }] });
  }
  function removeFaq(i: number) {
    if (!site) return;
    setSite({ ...site, faq: site.faq.filter((_, idx) => idx !== i) });
  }

  const centerFormations = formations.filter((f) => f.centerId === centerId && f.statut === 'Active');
  const centerTarifs = tarifs.filter((t) => t.centerId === centerId);

  return (
    <div className="space-y-lg">
      <PageHeader title="Site public" subtitle={`Contenu, thème et aperçu en direct du site de ${centre.nom}.`}>
        <label className="flex min-h-[44px] items-center gap-2 rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-on-surface">
          Site activé
          <Toggle checked={site.enabled} onChange={toggleEnabled} disabled={!allowed} label="Activer le site public" />
        </label>
        {site.enabled ? (
          <Link
            href={`/amud/centres/${centre.slug}`}
            target="_blank"
            className="inline-flex min-h-[44px] shrink-0 items-center gap-2 rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low"
          >
            <span className="material-symbols-outlined text-[18px]">open_in_new</span> Voir le site
          </Link>
        ) : null}
      </PageHeader>

      {!allowed ? <ReadOnlyNotice>Votre rôle actuel ne permet pas de modifier le site public — lecture seule.</ReadOnlyNotice> : null}

      <div className="xl:hidden">
        <SegmentedControl
          label="Vue"
          value={pane}
          onChange={setPane}
          options={[
            { value: 'edition', label: 'Édition' },
            { value: 'apercu', label: 'Aperçu' },
          ]}
        />
      </div>

      <div className={`rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm sm:p-lg ${pane === 'apercu' ? 'hidden xl:block' : ''}`}>
        <div className="mb-1 flex items-center justify-between gap-sm">
          <h2 className="text-title-lg text-amud-on-surface">Thème</h2>
          <Link href="/amud/centre/site/themes" className="text-label-sm text-amud-primary hover:underline">
            Aperçu détaillé →
          </Link>
        </div>
        <p className="mb-md text-label-md text-amud-on-surface-variant">
          Chaque thème change réellement la navigation, le hero, les cartes, les boutons, les sections, la typographie et le pied de page.
        </p>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-2 lg:grid-cols-3">
          {THEMES.map((th) => (
            <ThemePreviewCard key={th.id} theme={th.id} selected={theme === th.id} disabled={!allowed} onSelect={() => handleThemeChange(th.id)} />
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-lg xl:grid-cols-2">
        <form onSubmit={handleSave} className={`space-y-lg ${pane === 'apercu' ? 'hidden xl:block' : ''}`}>
          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Contenu</h3>
            <div className="space-y-md">
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface-variant">Accroche (tagline)</label>
                <textarea disabled={!allowed} value={site.tagline} onChange={(e) => setSite({ ...site, tagline: e.target.value })} rows={2} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" />
              </div>
              <div>
                <label className="mb-1 block text-label-md text-amud-on-surface-variant">Texte du bouton d’appel à l’action</label>
                <input disabled={!allowed} value={site.ctaLabel} onChange={(e) => setSite({ ...site, ctaLabel: e.target.value })} className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
              </div>
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="mb-md flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">Avantages</h3>
              {allowed ? <button type="button" onClick={addAvantage} className="text-label-sm text-amud-primary hover:underline">+ Ajouter</button> : null}
            </div>
            <div className="space-y-sm">
              {site.avantages.map((a, i) => (
                <div key={i} className="flex gap-sm">
                  <input disabled={!allowed} value={a} onChange={(e) => updateAvantage(i, e.target.value)} className="flex-1 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
                  {allowed ? <button type="button" onClick={() => removeAvantage(i)} className="rounded-lg p-2 text-amud-error hover:bg-amud-error-container/20"><span className="material-symbols-outlined text-[18px]">delete</span></button> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="mb-md flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">Témoignages</h3>
              {allowed ? <button type="button" onClick={addTemoignage} className="text-label-sm text-amud-primary hover:underline">+ Ajouter</button> : null}
            </div>
            <div className="space-y-md">
              {site.temoignages.map((tm, i) => (
                <div key={i} className="rounded-lg border border-amud-outline-variant p-md">
                  <div className="mb-sm grid grid-cols-2 gap-sm">
                    <input disabled={!allowed} value={tm.nom} onChange={(e) => updateTemoignage(i, { nom: e.target.value })} placeholder="Nom" className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
                    <input disabled={!allowed} value={tm.role} onChange={(e) => updateTemoignage(i, { role: e.target.value })} placeholder="Rôle (ex: Niveau B1)" className="rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
                  </div>
                  <textarea disabled={!allowed} value={tm.texte} onChange={(e) => updateTemoignage(i, { texte: e.target.value })} rows={2} placeholder="Témoignage" className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" />
                  {allowed ? <button type="button" onClick={() => removeTemoignage(i)} className="mt-sm text-label-sm text-amud-error hover:underline">Supprimer</button> : null}
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <div className="mb-md flex items-center justify-between">
              <h3 className="text-title-lg text-amud-on-surface">FAQ</h3>
              {allowed ? <button type="button" onClick={addFaq} className="text-label-sm text-amud-primary hover:underline">+ Ajouter</button> : null}
            </div>
            <div className="space-y-md">
              {site.faq.map((f, i) => (
                <div key={i} className="rounded-lg border border-amud-outline-variant p-md">
                  <input disabled={!allowed} value={f.question} onChange={(e) => updateFaq(i, { question: e.target.value })} placeholder="Question" className="mb-sm w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" type="text" />
                  <textarea disabled={!allowed} value={f.reponse} onChange={(e) => updateFaq(i, { reponse: e.target.value })} rows={2} placeholder="Réponse" className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary disabled:opacity-60" />
                  {allowed ? <button type="button" onClick={() => removeFaq(i)} className="mt-sm text-label-sm text-amud-error hover:underline">Supprimer</button> : null}
                </div>
              ))}
            </div>
          </div>

          {allowed ? (
            <button type="submit" className="w-full rounded-lg bg-amud-primary px-lg py-2.5 text-label-md font-medium text-white shadow-sm hover:brightness-110">
              Enregistrer le contenu
            </button>
          ) : null}
        </form>

        <div className={`xl:sticky xl:top-4 xl:self-start ${pane === 'edition' ? 'hidden xl:block' : ''}`}>
          <div className="mb-sm flex flex-wrap items-center justify-between gap-sm">
            <p className="text-label-md font-semibold text-amud-on-surface-variant">Aperçu en direct</p>
            <SegmentedControl
              label="Largeur de l’aperçu"
              value={previewWidth}
              onChange={setPreviewWidth}
              options={[
                { value: 'mobile', label: 'Mobile' },
                { value: 'desktop', label: 'Desktop' },
              ]}
            />
          </div>
          <div className="flex justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container shadow-sm">
            <div
              className="max-h-[80vh] w-full overflow-y-auto bg-amud-surface transition-[max-width]"
              style={previewWidth === 'mobile' ? { maxWidth: 390 } : undefined}
            >
              <PublicSiteRenderer centre={{ ...centre, theme, site }} formations={centerFormations} tarifs={centerTarifs} compact />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
