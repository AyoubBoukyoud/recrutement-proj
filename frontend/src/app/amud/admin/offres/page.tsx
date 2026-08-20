'use client';

import { useEffect, useMemo, useState } from 'react';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_CLASS, offresSeed, type Offre, type Statut } from '@/data/amud/offres';
import { addLocalOffre, loadLocalOffres } from '@/lib/amud/localOffres';

const CONTRATS = ['CDI', 'CDD', 'Intérim', 'Stage', 'Freelance'];
const STATUTS: Statut[] = ['Brouillon', 'En attente', 'Publiée', 'Expirée', 'Refusée'];

export default function AmudAdminOffresPage() {
  const notify = useToast();
  const [offres, setOffres] = useState<Offre[]>(offresSeed);
  const [entreprise, setEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [applied, setApplied] = useState({ entreprise: '', secteur: '', statut: '' });
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [bulkOpen, setBulkOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [titre, setTitre] = useState('');
  const [addEntreprise, setAddEntreprise] = useState('');
  const [ville, setVille] = useState('');
  const [contrat, setContrat] = useState(CONTRATS[0]);
  const [addStatut, setAddStatut] = useState<Statut>('Brouillon');

  useEffect(() => {
    const extra = loadLocalOffres();
    if (extra.length) setOffres([...offresSeed, ...extra]);
  }, []);

  const filtered = useMemo(() => {
    return offres.filter(
      (o) => (!applied.entreprise || o.entreprise === applied.entreprise) && (!applied.statut || o.statut === applied.statut),
    );
  }, [offres, applied]);

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
    const offre: Offre = {
      id: `offre-${Date.now()}`,
      titre: titre.trim(),
      entreprise: addEntreprise.trim(),
      recruteur: '—',
      ville: ville.trim() || '—',
      contrat,
      candidatures: null,
      publication: addStatut === 'Publiée' ? new Date().toLocaleDateString('fr-FR') : '-',
      statut: addStatut,
    };
    setOffres((prev) => [offre, ...prev]);
    addLocalOffre(offre);
    notify(`Offre « ${offre.titre} » créée.`);
    setAddOpen(false);
    resetAddForm();
  }

  function setRowStatut(id: string, next: Statut) {
    setOffres((prev) => prev.map((o) => (o.id === id ? { ...o, statut: next } : o)));
    setOpenMenu(null);
  }

  function removeRow(id: string) {
    setOffres((prev) => prev.filter((o) => o.id !== id));
    setSelected((prev) => prev.filter((x) => x !== id));
    setOpenMenu(null);
    notify('Offre supprimée.', 'info');
  }

  function bulkPublier() {
    setOffres((prev) => prev.map((o) => (selected.includes(o.id) ? { ...o, statut: 'Publiée' as Statut, publication: new Date().toLocaleDateString('fr-FR') } : o)));
    notify(`${selected.length} offre(s) publiée(s).`);
    setSelected([]);
    setBulkOpen(false);
  }

  function bulkSupprimer() {
    setOffres((prev) => prev.filter((o) => !selected.includes(o.id)));
    notify(`${selected.length} offre(s) supprimée(s).`, 'info');
    setSelected([]);
    setBulkOpen(false);
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
                <button onClick={bulkSupprimer} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
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
                        {o.statut !== 'Expirée' ? (
                          <button onClick={() => setRowStatut(o.id, 'Expirée')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Archiver
                          </button>
                        ) : null}
                        <button onClick={() => removeRow(o.id)} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
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
    </div>
  );
}
