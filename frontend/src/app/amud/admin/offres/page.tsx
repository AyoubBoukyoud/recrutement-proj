'use client';

import { useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { ConfirmDialog, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_CLASS, offresSeed, type Offre, type Statut } from '@/data/amud/offres';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { offresCollection } from '@/lib/amud/localOffres';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { logAudit } from '@/lib/amud/storage/audit';
import { pushNotification } from '@/lib/amud/storage/notify';

const CONTRATS = ['CDI', 'CDD', 'Intérim', 'Stage', 'Freelance'];
const STATUTS: Statut[] = ['Brouillon', 'En attente', 'Publiée', 'En pause', 'Expirée', 'Refusée', 'Archivée'];

export default function AmudAdminOffresPage() {
  const notify = useToast();
  const searchParams = useSearchParams();
  const [offres, { add: addOffreRaw, update: updateOffre, remove: removeOffre }] = useCollection(offresCollection, offresSeed);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [entreprise, setEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [applied, setApplied] = useState({ entreprise: '', secteur: '', statut: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [confirmBulkDelete, setConfirmBulkDelete] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [addEntreprise, setAddEntreprise] = useState('');
  const [ville, setVille] = useState('');
  const [contrat, setContrat] = useState(CONTRATS[0]);
  const [addStatut, setAddStatut] = useState<Statut>('Brouillon');

  const secteurByEntrepriseId = useMemo(() => new Map(entreprises.map((e) => [e.id, e.secteur])), [entreprises]);
  const secteurOf = (o: Offre) => (o.entrepriseId ? secteurByEntrepriseId.get(o.entrepriseId) : undefined);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return offres.filter(
      (o) =>
        (!q || o.titre.toLowerCase().includes(q) || o.entreprise.toLowerCase().includes(q)) &&
        (!applied.entreprise || o.entreprise === applied.entreprise) &&
        (!applied.secteur || secteurOf(o) === applied.secteur) &&
        (!applied.statut || o.statut === applied.statut),
    );
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [offres, search, applied, secteurByEntrepriseId]);

  const kpis: { label: string; value: number; cls: string }[] = [
    { label: 'Total', value: offres.length, cls: 'text-amud-on-surface' },
    { label: 'Brouillons', value: offres.filter((o) => o.statut === 'Brouillon').length, cls: 'text-amud-on-surface-variant' },
    { label: 'En attente', value: offres.filter((o) => o.statut === 'En attente').length, cls: 'text-amud-tertiary' },
    { label: 'Publiées', value: offres.filter((o) => o.statut === 'Publiée').length, cls: 'text-amud-primary' },
    { label: 'Expirées', value: offres.filter((o) => o.statut === 'Expirée').length, cls: 'text-amud-on-surface' },
    { label: 'Refusées', value: offres.filter((o) => o.statut === 'Refusée').length, cls: 'text-amud-error' },
  ];

  function resetAddForm() {
    setTitre('');
    setAddEntreprise('');
    setVille('');
    setContrat(CONTRATS[0]);
    setAddStatut('Brouillon');
  }

  function handleAddOffre(e: React.FormEvent) {
    e.preventDefault();
    if (!titre.trim() || !addEntreprise.trim()) return;
    const matched = entreprises.find((ent) => ent.nom.toLowerCase() === addEntreprise.trim().toLowerCase());
    const offre: Offre = {
      id: generateId('offre'),
      titre: titre.trim(),
      entreprise: addEntreprise.trim(),
      entrepriseId: matched?.id,
      recruteur: '—',
      ville: ville.trim() || '—',
      contrat,
      candidatures: null,
      publication: addStatut === 'Publiée' ? new Date().toLocaleDateString('fr-FR') : '-',
      statut: addStatut,
    };
    addOffreRaw(offre);
    logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Création offre', actionType: 'create', module: 'Offres', reference: `${offre.titre} (#${offre.id})` });
    notify(`Offre « ${offre.titre} » créée.`);
    setAddOpen(false);
    resetAddForm();
  }

  function setRowStatut(id: string, next: Statut) {
    const o = offres.find((x) => x.id === id);
    updateOffre(id, { statut: next, publication: next === 'Publiée' ? new Date().toLocaleDateString('fr-FR') : o?.publication ?? '-' });
    if (o) {
      logAudit({
        utilisateur: 'Administrateur',
        role: 'Admin',
        action: next === 'Publiée' ? 'Publication offre' : `Changement de statut (${next})`,
        actionType: 'update',
        module: 'Offres',
        reference: `${o.titre} (#${o.id})`,
        diff: { before: `"statut": "${o.statut}"`, after: `"statut": "${next}"` },
      });
      if (next === 'Publiée') {
        pushNotification({ scope: 'admin', title: `Offre « ${o.titre} » publiée.`, category: 'Offres', href: '/amud/admin/offres' });
      }
    }
    setOpenMenu(null);
    notify('Statut de l’offre mis à jour.');
  }

  function removeRow(id: string) {
    const o = offres.find((x) => x.id === id);
    removeOffre(id);
    if (o) logAudit({ utilisateur: 'Administrateur', role: 'Admin', action: 'Suppression offre', actionType: 'delete', module: 'Offres', reference: `${o.titre} (#${o.id})` });
    setSelected((prev) => prev.filter((x) => x !== id));
    setOpenMenu(null);
    notify('Offre supprimée.', 'info');
  }

  function bulkPublier() {
    const today = new Date().toLocaleDateString('fr-FR');
    for (const id of selected) updateOffre(id, { statut: 'Publiée', publication: today });
    notify(`${selected.length} offre(s) publiée(s).`);
    setSelected([]);
    setBulkOpen(false);
  }

  function bulkSupprimer() {
    for (const id of selected) removeOffre(id);
    notify(`${selected.length} offre(s) supprimée(s).`, 'info');
    setSelected([]);
    setBulkOpen(false);
    setConfirmBulkDelete(false);
  }

  return (
    <div>
      <div className="mb-xl flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des offres</h2>
          <p className="mt-sm text-body-md text-amud-on-surface-variant">Gérez et suivez le statut de toutes les offres d&apos;emploi sur la plateforme.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
            add
          </span>
          Ajouter une offre
        </button>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-md md:grid-cols-3 lg:grid-cols-6">
        {kpis.map((k, i) => (
          <div
            key={k.label}
            className={`flex flex-col justify-between rounded-xl border p-md shadow-sm ${
              i === 2 ? 'border-l-4 border-amud-on-tertiary-container bg-amud-surface-container-high' : 'border-amud-outline-variant bg-amud-surface'
            }`}
          >
            <span className={`text-label-sm ${i === 2 ? 'text-amud-tertiary' : 'text-amud-on-surface-variant'}`}>{k.label}</span>
            <span className={`mt-sm text-headline-md font-bold ${k.cls}`}>{k.value}</span>
          </div>
        ))}
      </div>

      <div className="mb-xl rounded-xl border border-amud-outline-variant bg-amud-surface p-lg shadow-sm">
        <div className="mb-md">
          <label className="mb-xs block text-label-sm text-amud-on-surface-variant">Recherche</label>
          <div className="relative max-w-md">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Titre du poste ou entreprise…"
              type="text"
            />
          </div>
        </div>
        <div className="grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
          <div>
            <label className="mb-xs block text-label-sm text-amud-on-surface-variant">Entreprise</label>
            <select
              value={entreprise}
              onChange={(e) => setEntreprise(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-2 text-body-md focus:outline-none focus:ring-2 focus:ring-amud-primary"
            >
              <option value="">Toutes les entreprises</option>
              {Array.from(new Set(offres.map((o) => o.entreprise))).map((e) => (
                <option key={e}>{e}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-xs block text-label-sm text-amud-on-surface-variant">Secteur</label>
            <select
              value={secteur}
              onChange={(e) => setSecteur(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-2 text-body-md focus:outline-none focus:ring-2 focus:ring-amud-primary"
            >
              <option value="">Tous les secteurs</option>
              <option>IT</option>
              <option>Santé</option>
              <option>BTP</option>
              <option>Design</option>
            </select>
          </div>
          <div>
            <label className="mb-xs block text-label-sm text-amud-on-surface-variant">Statut</label>
            <select
              value={statut}
              onChange={(e) => setStatut(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-2 text-body-md focus:outline-none focus:ring-2 focus:ring-amud-primary"
            >
              <option value="">Tous les statuts</option>
              {STATUTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={() => setApplied({ entreprise, secteur, statut })}
              className="w-full rounded-lg bg-amud-primary py-2 text-label-md font-medium text-white transition-colors hover:bg-amud-primary-dark"
            >
              Appliquer les filtres
            </button>
          </div>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container p-md">
          <span className="text-label-md text-amud-on-surface">{filtered.length} résultats</span>
          <div className="relative">
            <button
              disabled={!selected.length}
              onClick={() => setBulkOpen((v) => !v)}
              className="rounded bg-amud-surface-container-highest px-3 py-1 text-label-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Actions en masse ({selected.length})
            </button>
            {bulkOpen && selected.length ? (
              <div className="absolute right-0 top-full z-10 mt-1 w-52 rounded-lg border border-amud-outline-variant bg-amud-surface shadow-lg animate-amud-fade-in">
                <button onClick={bulkPublier} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                  Publier la sélection
                </button>
                <button
                  onClick={() => {
                    setConfirmBulkDelete(true);
                    setBulkOpen(false);
                  }}
                  className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low"
                >
                  Supprimer la sélection
                </button>
              </div>
            ) : null}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low text-label-sm text-amud-on-surface-variant">
                <th className="w-12 p-md">
                  <input
                    type="checkbox"
                    checked={selected.length === filtered.length && filtered.length > 0}
                    onChange={() => setSelected(selected.length === filtered.length ? [] : filtered.map((o) => o.id))}
                    className="rounded border-amud-outline-variant text-amud-primary focus:ring-amud-primary"
                  />
                </th>
                <th className="p-md">Titre de l&apos;offre &amp; Entreprise</th>
                <th className="hidden p-md md:table-cell">Lieu &amp; Contrat</th>
                <th className="hidden p-md lg:table-cell">Candidatures</th>
                <th className="hidden p-md xl:table-cell">Publication</th>
                <th className="p-md">Statut</th>
                <th className="p-md text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md">
              {filtered.map((o) => (
                <tr key={o.id} className="group animate-amud-rise-in border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-lowest">
                  <td className="p-md">
                    <input
                      type="checkbox"
                      checked={selected.includes(o.id)}
                      onChange={() => setSelected((prev) => (prev.includes(o.id) ? prev.filter((x) => x !== o.id) : [...prev, o.id]))}
                      className="rounded border-amud-outline-variant text-amud-primary focus:ring-amud-primary"
                    />
                  </td>
                  <td className="p-md">
                    <div className="font-medium text-amud-on-surface">{o.titre}</div>
                    <div className="text-sm text-amud-on-surface-variant">
                      {o.entreprise} • {o.recruteur}
                    </div>
                  </td>
                  <td className="hidden p-md md:table-cell">
                    <div>{o.ville}</div>
                    <div className="text-sm text-amud-on-surface-variant">{o.contrat}</div>
                  </td>
                  <td className="hidden p-md lg:table-cell">{o.candidatures ?? '-'}</td>
                  <td className="hidden p-md xl:table-cell">{o.publication}</td>
                  <td className="p-md">
                    <span className={`inline-flex items-center rounded-full px-2 py-1 text-xs font-medium ${STATUT_CLASS[o.statut]}`}>{o.statut}</span>
                  </td>
                  <td className="relative p-md text-right">
                    <button onClick={() => setOpenMenu(openMenu === o.id ? null : o.id)} className="text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === o.id ? (
                      <div className="absolute right-4 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                        {o.statut !== 'Publiée' ? (
                          <button onClick={() => setRowStatut(o.id, 'Publiée')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Publier
                          </button>
                        ) : null}
                        {o.statut !== 'En attente' ? (
                          <button onClick={() => setRowStatut(o.id, 'En attente')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Mettre en attente
                          </button>
                        ) : null}
                        {o.statut !== 'Refusée' ? (
                          <button onClick={() => setRowStatut(o.id, 'Refusée')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Rejeter
                          </button>
                        ) : null}
                        {o.statut !== 'Archivée' ? (
                          <button onClick={() => setRowStatut(o.id, 'Archivée')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Archiver
                          </button>
                        ) : null}
                        <button
                          onClick={() => {
                            setConfirmDeleteId(o.id);
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
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-lg text-center text-body-md text-amud-on-surface-variant">
                    Aucune offre ne correspond à ces filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
      </div>

      <Modal
        open={addOpen}
        onClose={() => setAddOpen(false)}
        title="Ajouter une offre"
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-offre-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Créer l&apos;offre
            </button>
          </div>
        }
      >
        <form id="add-offre-form" onSubmit={handleAddOffre} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Titre du poste</label>
            <input
              autoFocus
              value={titre}
              onChange={(e) => setTitre(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Développeur Fullstack React/Node"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Entreprise</label>
            <input
              value={addEntreprise}
              onChange={(e) => setAddEntreprise(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="TechCorp SA"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
            <input
              value={ville}
              onChange={(e) => setVille(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Paris, FR"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type de contrat</label>
            <select value={contrat} onChange={(e) => setContrat(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {CONTRATS.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Statut initial</label>
            <select value={addStatut} onChange={(e) => setAddStatut(e.target.value as Statut)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              {STATUTS.map((s) => (
                <option key={s}>{s}</option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeRow(confirmDeleteId)}
        title="Supprimer cette offre ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
      <ConfirmDialog
        open={confirmBulkDelete}
        onClose={() => setConfirmBulkDelete(false)}
        onConfirm={bulkSupprimer}
        title={`Supprimer ${selected.length} offre(s) ?`}
        description="Cette action est irréversible."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
