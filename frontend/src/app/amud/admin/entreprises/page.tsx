'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmDialog, Drawer, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_CLASS, entreprisesSeed, type Entreprise, type Statut } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { offresSeed } from '@/data/amud/offres';
import { offresCollection } from '@/lib/amud/localOffres';
import { applicationsSeed } from '@/data/amud/applications';
import { applicationsCollection } from '@/lib/amud/localApplications';

const PAGE_SIZE = 3;
const SECTEURS = ['IT', 'BTP', 'Santé', 'Transport', 'Design'];

export default function AmudAdminEntreprisesPage() {
  const notify = useToast();
  const searchParams = useSearchParams();
  const [entreprises, { add: addEntreprise, update: updateEntreprise, remove: removeEntreprise }] = useCollection(entreprisesCollection, entreprisesSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [applications] = useCollection(applicationsCollection, applicationsSeed);
  const offresCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const o of offres) if (o.entrepriseId) map.set(o.entrepriseId, (map.get(o.entrepriseId) ?? 0) + 1);
    return map;
  }, [offres]);
  const candidaturesCount = useMemo(() => {
    const map = new Map<string, number>();
    for (const a of applications) map.set(a.entrepriseId, (map.get(a.entrepriseId) ?? 0) + 1);
    return map;
  }, [applications]);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [ville, setVille] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [detail, setDetail] = useState<Entreprise | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [nom, setNom] = useState('');
  const [addVille, setAddVille] = useState('');
  const [addSecteur, setAddSecteur] = useState(SECTEURS[0]);
  const [addStatut, setAddStatut] = useState<Statut>('En attente');

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entreprises.filter(
      (e) =>
        (!q || e.nom.toLowerCase().includes(q)) &&
        (!ville || e.ville === ville) &&
        (!secteur || e.secteur === secteur) &&
        (!statut || e.statut === statut),
    );
  }, [entreprises, search, ville, secteur, statut]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilters() {
    setPage(1);
  }

  const kpis = [
    { label: 'Total entreprises', value: entreprises.length, accent: 'bg-amud-primary' },
    { label: 'Actives', value: entreprises.filter((e) => e.statut === 'Active' || e.statut === 'Vérifiée').length, accent: 'bg-amud-primary-container' },
    { label: 'En attente', value: entreprises.filter((e) => e.statut === 'En attente').length, accent: 'bg-amud-tertiary-fixed-dim' },
    { label: 'Vérifiées', value: entreprises.filter((e) => e.statut === 'Vérifiée').length, accent: 'bg-amud-primary-fixed-dim' },
    { label: 'Bloquées', value: entreprises.filter((e) => e.statut === 'Bloquée').length, accent: 'bg-amud-error' },
  ];

  function resetAddForm() {
    setNom('');
    setAddVille('');
    setAddSecteur(SECTEURS[0]);
    setAddStatut('En attente');
  }

  function handleAddEntreprise(e: React.FormEvent) {
    e.preventDefault();
    if (!nom.trim()) return;
    const entreprise: Entreprise = {
      id: generateId('entreprise'),
      nom: nom.trim(),
      icon: 'apartment',
      recruteurs: 0,
      offres: 0,
      candidatures: 0,
      ville: addVille.trim() || '—',
      secteur: addSecteur,
      statut: addStatut,
      derniereActivite: "Aujourd'hui",
    };
    addEntreprise(entreprise);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Création entreprise', actionType: 'create', module: 'Entreprises', reference: `${entreprise.nom} (#${entreprise.id})` });
    notify(`« ${entreprise.nom} » ajoutée aux entreprises partenaires.`);
    setAddOpen(false);
    resetAddForm();
  }

  function toggleBloquee(id: string) {
    const e = entreprises.find((x) => x.id === id);
    if (!e) return;
    const next = e.statut === 'Bloquée' ? 'Active' : 'Bloquée';
    updateEntreprise(id, { statut: next });
    logAudit({
      utilisateur: 'Administrateur',
      role: 'Admin',
      action: next === 'Bloquée' ? 'Blocage entreprise' : 'Réactivation entreprise',
      actionType: next === 'Bloquée' ? 'disable' : 'update',
      module: 'Entreprises',
      reference: `${e.nom} (#${e.id})`,
    });
    setOpenMenu(null);
    notify('Statut mis à jour.');
  }

  function removeRow(id: string) {
    const e = entreprises.find((x) => x.id === id);
    removeEntreprise(id);
    if (e) logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression entreprise', actionType: 'delete', module: 'Entreprises', reference: `${e.nom} (#${e.id})` });
    setOpenMenu(null);
    notify('Entreprise supprimée.', 'info');
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des entreprises</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez et suivez les entreprises partenaires.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
          Ajouter une entreprise
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-5 md:gap-gutter">
        {kpis.map((k) => (
          <div key={k.label} className="relative flex flex-col items-start justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-6 shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className={`absolute bottom-0 left-0 top-0 w-1 ${k.accent}`} />
            <span className="mb-2 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">{k.label}</span>
            <span className="text-headline-lg text-amud-on-surface">{k.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-6 flex flex-col items-center gap-4 rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
            placeholder="Rechercher par nom d'entreprise…"
            type="text"
          />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <select
            value={ville}
            onChange={(e) => {
              setVille(e.target.value);
              applyFilters();
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="">Ville</option>
            <option>Casablanca</option>
            <option>Berlin</option>
            <option>Lyon</option>
            <option>Marrakech</option>
          </select>
          <select
            value={secteur}
            onChange={(e) => {
              setSecteur(e.target.value);
              applyFilters();
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="">Secteur</option>
            {SECTEURS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              applyFilters();
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="">Statut</option>
            <option>Active</option>
            <option>En attente</option>
            <option>Bloquée</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Entreprise</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Recruteurs</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Offres actives</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Candidatures</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Ville / Secteur</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Dernière activité</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {paged.map((e) => (
              <tr key={e.id} className="animate-amud-rise-in transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-amud-outline-variant bg-amud-surface">
                      <span className="material-symbols-outlined text-amud-primary">{e.icon}</span>
                    </div>
                    <span className="text-label-md font-semibold text-amud-on-surface">{e.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{e.recruteurs}</td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{offresCount.get(e.id) ?? 0}</td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{candidaturesCount.get(e.id) ?? 0}</td>
                <td className="px-6 py-4">
                  <div className="flex flex-col">
                    <span className="text-body-md text-amud-on-surface">{e.ville}</span>
                    <span className="text-label-sm text-amud-on-surface-variant">{e.secteur}</span>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CLASS[e.statut]}`}>{e.statut}</span>
                </td>
                <td className="px-6 py-4 text-body-md text-amud-on-surface-variant">{e.derniereActivite}</td>
                <td className="relative px-6 py-4 text-right">
                  <button onClick={() => setOpenMenu(openMenu === e.id ? null : e.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenu === e.id ? (
                    <div className="absolute right-6 top-12 z-10 w-44 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                      <button
                        onClick={() => {
                          setDetail(e);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Voir la fiche
                      </button>
                      <button onClick={() => toggleBloquee(e.id)} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                        {e.statut === 'Bloquée' ? 'Réactiver' : 'Suspendre'}
                      </button>
                      <button
                        onClick={() => {
                          setConfirmDeleteId(e.id);
                          setOpenMenu(null);
                        }}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
                      >
                        Supprimer
                      </button>
                    </div>
                  ) : null}
                </td>
              </tr>
            ))}
            {paged.length === 0 ? (
              <tr>
                <td colSpan={8} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucune entreprise ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>

      <div className="mt-6 flex items-center justify-between text-amud-on-surface-variant">
        <span className="text-body-md">
          Affichage de {paged.length ? (page - 1) * PAGE_SIZE + 1 : 0} à {(page - 1) * PAGE_SIZE + paged.length} sur {filtered.length}
        </span>
        <div className="flex gap-2">
          <button
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="rounded-md border border-amud-outline-variant px-3 py-1 hover:bg-amud-surface-container-low disabled:opacity-50"
          >
            Précédent
          </button>
          {Array.from({ length: pageCount }).map((_, i) => (
            <button
              key={i}
              onClick={() => setPage(i + 1)}
              className={`rounded-md border px-3 py-1 ${
                page === i + 1 ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant hover:bg-amud-surface-container-low'
              }`}
            >
              {i + 1}
            </button>
          ))}
          <button
            disabled={page >= pageCount}
            onClick={() => setPage((p) => Math.min(pageCount, p + 1))}
            className="rounded-md border border-amud-outline-variant px-3 py-1 hover:bg-amud-surface-container-low disabled:opacity-50"
          >
            Suivant
          </button>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter une entreprise"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-entreprise-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Ajouter
            </button>
          </div>
        }
      >
        <form id="add-entreprise-form" onSubmit={handleAddEntreprise} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom de l&apos;entreprise</label>
            <input
              autoFocus
              value={nom}
              onChange={(e) => setNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="TechCorp SA"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
            <input
              value={addVille}
              onChange={(e) => setAddVille(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Casablanca"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Secteur</label>
            <select value={addSecteur} onChange={(e) => setAddSecteur(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {SECTEURS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut initial</label>
            <select value={addStatut} onChange={(e) => setAddStatut(e.target.value as Statut)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              <option>En attente</option>
              <option>Active</option>
              <option>Vérifiée</option>
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeRow(confirmDeleteId)}
        title="Supprimer cette entreprise ?"
        description="Cette action est irréversible. L'entreprise sera retirée de la liste des partenaires."
        confirmLabel="Supprimer"
      />

      <Drawer open={!!detail} onClose={() => setDetail(null)} title={detail?.nom ?? ''} subtitle={detail ? `${detail.secteur} · ${detail.ville}` : undefined}>
        {detail ? (
          <div className="space-y-lg">
            <div className="grid grid-cols-2 gap-md">
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md text-center">
                <div className="text-headline-md text-amud-primary">{detail.recruteurs}</div>
                <div className="text-label-sm text-amud-on-surface-variant">Recruteurs</div>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md text-center">
                <div className="text-headline-md text-amud-primary">{offresCount.get(detail.id) ?? 0}</div>
                <div className="text-label-sm text-amud-on-surface-variant">Offres actives</div>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md text-center">
                <div className="text-headline-md text-amud-primary">{candidaturesCount.get(detail.id) ?? 0}</div>
                <div className="text-label-sm text-amud-on-surface-variant">Candidatures</div>
              </div>
              <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md text-center">
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CLASS[detail.statut]}`}>{detail.statut}</span>
              </div>
            </div>
            <p className="text-body-md text-amud-on-surface-variant">Dernière activité : {detail.derniereActivite}</p>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
