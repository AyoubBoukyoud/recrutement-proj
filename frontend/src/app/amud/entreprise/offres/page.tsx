'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ConfirmDialog, useDropdown } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed, STATUT_CLASS, type Offre, type Statut } from '@/data/amud/offres';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed } from '@/data/amud/applications';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { publishOffer, pauseOffer, reactivateOffer, archiveOffer, deleteOffer, duplicateOffer } from '@/lib/amud/offerCascades';

type TabId = 'Toutes' | 'Brouillon' | 'Publiée' | 'En pause' | 'Expirée' | 'Archivée';
const TABS: { id: TabId; label: string }[] = [
  { id: 'Toutes', label: 'Toutes' },
  { id: 'Brouillon', label: 'Brouillons' },
  { id: 'Publiée', label: 'Publiées' },
  { id: 'En pause', label: 'En pause' },
  { id: 'Expirée', label: 'Expirées' },
  { id: 'Archivée', label: 'Archivées' },
];

function OffreActionsMenu({ offre, applicationsCount, onChanged }: { offre: Offre; applicationsCount: number; onChanged: (message: string) => void }) {
  const menu = useDropdown<HTMLDivElement>();
  const [confirmDelete, setConfirmDelete] = useState(false);

  return (
    <div ref={menu.ref} className="relative">
      <button
        onClick={() => menu.setOpen((v) => !v)}
        className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary"
        aria-label="Actions sur l’offre"
        aria-haspopup="menu"
        aria-expanded={menu.open}
      >
        <span className="material-symbols-outlined">more_vert</span>
      </button>
      {menu.open ? (
        <div className="absolute right-0 top-full z-20 mt-1 w-52 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface py-1 shadow-lg animate-amud-fade-in">
          <Link href={`/amud/entreprise/offres/${offre.id}`} onClick={() => menu.setOpen(false)} className="block px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Voir
          </Link>
          <Link href={`/amud/entreprise/offres/${offre.id}/modifier`} onClick={() => menu.setOpen(false)} className="block px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
            Modifier
          </Link>
          <button
            onClick={() => {
              duplicateOffer(offre);
              onChanged(`« ${offre.titre} » dupliquée.`);
              menu.setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
          >
            Dupliquer
          </button>
          {offre.statut !== 'Publiée' ? (
            <button
              onClick={() => {
                publishOffer(offre);
                onChanged(`« ${offre.titre} » publiée.`);
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              Publier
            </button>
          ) : (
            <button
              onClick={() => {
                pauseOffer(offre);
                onChanged(`« ${offre.titre} » mise en pause.`);
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              Mettre en pause
            </button>
          )}
          {offre.statut === 'En pause' || offre.statut === 'Expirée' ? (
            <button
              onClick={() => {
                reactivateOffer(offre);
                onChanged(`« ${offre.titre} » réactivée.`);
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              Réactiver
            </button>
          ) : null}
          {offre.statut !== 'Archivée' ? (
            <button
              onClick={() => {
                archiveOffer(offre);
                onChanged(`« ${offre.titre} » archivée.`);
                menu.setOpen(false);
              }}
              className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
            >
              Archiver
            </button>
          ) : null}
          <button
            onClick={() => {
              setConfirmDelete(true);
              menu.setOpen(false);
            }}
            className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
          >
            Supprimer
          </button>
        </div>
      ) : null}
      <ConfirmDialog
        open={confirmDelete}
        onClose={() => setConfirmDelete(false)}
        onConfirm={() => {
          deleteOffer(offre);
          onChanged(`« ${offre.titre} » supprimée.`);
        }}
        title="Supprimer cette offre ?"
        description={applicationsCount > 0 ? `${applicationsCount} candidature(s) y sont rattachées. Cette action est irréversible.` : 'Cette action est irréversible.'}
        confirmLabel="Supprimer"
      />
    </div>
  );
}

export default function AmudEntrepriseOffresPage() {
  const notify = useToast();
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const [tab, setTab] = useState<TabId>('Toutes');
  const [search, setSearch] = useState('');
  const [vue, setVue] = useState<'cards' | 'table'>('cards');

  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);

  const applicationsCountByOffer = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) map.set(a.offerId, (map.get(a.offerId) ?? 0) + 1);
    return map;
  }, [applications]);

  const counts = useMemo(() => {
    const out: Record<TabId, number> = { Toutes: myOffres.length, Brouillon: 0, Publiée: 0, 'En pause': 0, Expirée: 0, Archivée: 0 };
    for (const o of myOffres) {
      if (o.statut in out) out[o.statut as TabId] += 1;
    }
    return out;
  }, [myOffres]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return myOffres
      .filter((o) => tab === 'Toutes' || o.statut === (tab as Statut))
      .filter((o) => !q || o.titre.toLowerCase().includes(q) || (o.localisation ?? o.ville).toLowerCase().includes(q))
      .sort((a, b) => b.id.localeCompare(a.id));
  }, [myOffres, tab, search]);

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Offres</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les offres d’emploi de {CURRENT_EMPLOYER.entrepriseNom}.</p>
        </div>
        <Link
          href="/amud/entreprise/offres/nouveau"
          className="flex items-center gap-2 rounded-lg bg-amud-primary px-lg py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:brightness-110"
        >
          <span className="material-symbols-outlined text-[20px]">add</span>
          Créer une offre
        </Link>
      </div>

      <div className="mb-md flex flex-wrap items-center gap-sm overflow-x-auto">
        {TABS.map((t) => (
          <button
            key={t.id}
            onClick={() => setTab(t.id)}
            className={`shrink-0 rounded-full px-md py-1.5 text-label-md font-medium transition-colors ${
              tab === t.id ? 'bg-amud-primary text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant hover:bg-amud-surface-container-highest'
            }`}
          >
            {t.label} ({counts[t.id]})
          </button>
        ))}
      </div>

      <div className="mb-md flex flex-col gap-sm sm:flex-row sm:items-center sm:justify-between">
        <div className="relative max-w-md flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Rechercher un poste, une ville…"
            aria-label="Rechercher un poste, une ville"
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            type="text"
          />
        </div>
        <div className="hidden shrink-0 items-center gap-1 rounded-lg bg-amud-surface-container-high p-1 md:flex">
          <button onClick={() => setVue('cards')} className={`rounded-md px-sm py-1.5 text-label-sm font-medium ${vue === 'cards' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}>
            Cartes
          </button>
          <button onClick={() => setVue('table')} className={`rounded-md px-sm py-1.5 text-label-sm font-medium ${vue === 'table' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant'}`}>
            Tableau
          </button>
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">work_off</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucune offre publiée.</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Créez votre première offre pour commencer à recevoir des candidatures.</p>
          <Link href="/amud/entreprise/offres/nouveau" className="mt-md inline-flex items-center gap-1 rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:brightness-110">
            Créer une offre
          </Link>
        </div>
      ) : vue === 'table' ? (
        <div className="hidden overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm md:block">
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-left">
              <thead>
                <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low text-label-sm text-amud-on-surface-variant">
                  <th className="p-md">Poste</th>
                  <th className="p-md">Ville &amp; contrat</th>
                  <th className="p-md">Publication</th>
                  <th className="p-md">Candidatures</th>
                  <th className="p-md">Vues</th>
                  <th className="p-md">Statut</th>
                  <th className="p-md text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((o) => (
                  <tr key={o.id} className="border-b border-amud-outline-variant last:border-0 hover:bg-amud-surface-container-lowest">
                    <td className="p-md font-medium text-amud-on-surface">{o.titre}</td>
                    <td className="p-md text-body-md text-amud-on-surface-variant">
                      {o.localisation ?? o.ville} · {o.contrat}
                    </td>
                    <td className="p-md text-body-md text-amud-on-surface-variant">{o.publication}</td>
                    <td className="p-md text-body-md text-amud-on-surface-variant">{applicationsCountByOffer.get(o.id) ?? 0}</td>
                    <td className="p-md text-body-md text-amud-on-surface-variant">{o.vues ?? 0}</td>
                    <td className="p-md">
                      <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUT_CLASS[o.statut]}`}>{o.statut}</span>
                    </td>
                    <td className="p-md text-right">
                      <OffreActionsMenu offre={o} applicationsCount={applicationsCountByOffer.get(o.id) ?? 0} onChanged={(msg) => notify(msg)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((o) => (
            <div key={o.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
              <div className="flex items-start justify-between gap-sm">
                <Link href={`/amud/entreprise/offres/${o.id}`} className="min-w-0 font-bold text-amud-on-surface hover:text-amud-primary">
                  {o.titre}
                </Link>
                <OffreActionsMenu offre={o} applicationsCount={applicationsCountByOffer.get(o.id) ?? 0} onChanged={(msg) => notify(msg)} />
              </div>
              <span className={`inline-flex w-fit items-center rounded-full px-2 py-1 text-xs font-medium ${STATUT_CLASS[o.statut]}`}>{o.statut}</span>
              <div className="flex flex-wrap items-center gap-x-md gap-y-1 text-label-sm text-amud-on-surface-variant">
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">location_on</span> {o.localisation ?? o.ville}
                </span>
                <span className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-[16px]">work</span> {o.contrat}
                </span>
              </div>
              <div className="mt-1 flex items-center justify-between border-t border-amud-outline-variant pt-sm text-label-sm text-amud-on-surface-variant">
                <span>Publié : {o.publication}</span>
                <span className="flex items-center gap-md">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">group</span> {applicationsCountByOffer.get(o.id) ?? 0}
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-[16px]">visibility</span> {o.vues ?? 0}
                  </span>
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
