'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_CLASS, candidatesSeed, type Candidate, type StatutCandidate } from '@/data/amud/candidates';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';

const PAGE_SIZE = 6;
type SortKey = 'nom' | 'score' | 'creeLe';
const DISPONIBILITES = ['Immédiate', 'Sous 1 mois', 'Sous 2 mois'];

function todayFr() {
  return new Date().toLocaleDateString('fr-FR');
}

function initials(nom: string) {
  return nom
    .split(' ')
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AmudAdminCandidatsPage() {
  const notify = useToast();
  const [candidates, { add: addCandidate, update: updateCandidate, remove: removeCandidate }] = useCollection(candidatesCollection, candidatesSeed);
  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [statut, setStatut] = useState('');
  const [sort, setSort] = useState<SortKey>('nom');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  const [addOpen, setAddOpen] = useState(false);
  const [addNom, setAddNom] = useState('');
  const [addEmail, setAddEmail] = useState('');
  const [addTelephone, setAddTelephone] = useState('');
  const [addVille, setAddVille] = useState('');
  const [addPoste, setAddPoste] = useState('');
  const [addCompetences, setAddCompetences] = useState('');
  const [addDisponibilite, setAddDisponibilite] = useState(DISPONIBILITES[0]);

  function resetAddForm() {
    setAddNom('');
    setAddEmail('');
    setAddTelephone('');
    setAddVille('');
    setAddPoste('');
    setAddCompetences('');
    setAddDisponibilite(DISPONIBILITES[0]);
  }

  function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!addNom.trim() || !addEmail.trim() || !addEmail.includes('@')) return;
    const c: Candidate = {
      id: generateId('candidate'),
      nom: addNom.trim(),
      email: addEmail.trim(),
      telephone: addTelephone.trim(),
      ville: addVille.trim() || '—',
      posteRecherche: addPoste.trim() || '—',
      competences: addCompetences.split(',').map((s) => s.trim()).filter(Boolean),
      disponibilite: addDisponibilite,
      statut: 'Actif',
      score: 50,
      creeLe: todayFr(),
      dernierAcces: "Aujourd'hui",
    };
    addCandidate(c);
    notify(`« ${c.nom} » ajouté aux candidats.`);
    setAddOpen(false);
    resetAddForm();
  }

  const villes = useMemo(() => Array.from(new Set(candidates.map((c) => c.ville))).sort(), [candidates]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = candidates.filter(
      (c) =>
        (!q || c.nom.toLowerCase().includes(q) || c.email.toLowerCase().includes(q) || c.ville.toLowerCase().includes(q)) &&
        (!ville || c.ville === ville) &&
        (!statut || c.statut === statut),
    );
    return [...rows].sort((a, b) => {
      if (sort === 'score') return b.score - a.score;
      if (sort === 'creeLe') return b.creeLe.localeCompare(a.creeLe);
      return a.nom.localeCompare(b.nom);
    });
  }, [candidates, search, ville, statut, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = [
    { label: 'Total candidats', value: candidates.length, accent: 'bg-amud-primary' },
    { label: 'Actifs', value: candidates.filter((c) => c.statut === 'Actif').length, accent: 'bg-amud-primary-container' },
    { label: 'Disponibles immédiatement', value: candidates.filter((c) => c.disponibilite === 'Immédiate').length, accent: 'bg-amud-tertiary-fixed-dim' },
    { label: 'Bloqués', value: candidates.filter((c) => c.statut === 'Bloqué').length, accent: 'bg-amud-error' },
  ];

  function resetPage() {
    setPage(1);
  }

  function setStatutFor(id: string, next: StatutCandidate) {
    const c = candidates.find((x) => x.id === id);
    updateCandidate(id, { statut: next });
    setOpenMenu(null);
    notify(c ? `Statut de « ${c.nom} » mis à jour : ${next}.` : 'Statut mis à jour.');
  }

  function removeRow(id: string) {
    const c = candidates.find((x) => x.id === id);
    removeCandidate(id);
    setOpenMenu(null);
    notify(c ? `« ${c.nom} » supprimé.` : 'Candidat supprimé.', 'info');
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Candidats</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les profils candidats inscrits sur la plateforme Amud Skills.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined">add</span>
          Ajouter un candidat
        </button>
      </div>

      <div className="mb-8 grid grid-cols-2 gap-4 md:grid-cols-4 md:gap-gutter">
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
              resetPage();
            }}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
            placeholder="Rechercher par nom, email ou ville…"
            type="text"
          />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <select
            value={ville}
            onChange={(e) => {
              setVille(e.target.value);
              resetPage();
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="">Ville</option>
            {villes.map((v) => (
              <option key={v}>{v}</option>
            ))}
          </select>
          <select
            value={statut}
            onChange={(e) => {
              setStatut(e.target.value);
              resetPage();
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="">Statut</option>
            <option>Actif</option>
            <option>Inactif</option>
            <option>Bloqué</option>
          </select>
          <select
            value={sort}
            onChange={(e) => setSort(e.target.value as SortKey)}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
          >
            <option value="nom">Trier : Nom (A-Z)</option>
            <option value="score">Trier : Score</option>
            <option value="creeLe">Trier : Date d&apos;inscription</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Candidat</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Poste recherché</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Ville</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Score</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant xl:table-cell">Dernier accès</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {paged.map((c) => (
              <tr key={c.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <Link href={`/amud/admin/candidats/${c.id}`} className="group flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-sm font-bold text-white">
                      {initials(c.nom)}
                    </div>
                    <div>
                      <p className="font-semibold text-amud-on-surface transition-colors group-hover:text-amud-primary">{c.nom}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">{c.email}</p>
                    </div>
                  </Link>
                </td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant lg:table-cell">{c.posteRecherche}</td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{c.ville}</td>
                <td className="hidden px-6 py-4 text-center sm:table-cell">
                  <span className="font-semibold text-amud-on-surface">{c.score}</span>
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CLASS[c.statut]}`}>{c.statut}</span>
                </td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant xl:table-cell">{c.dernierAcces}</td>
                <td className="relative px-6 py-4 text-right">
                  <button onClick={() => setOpenMenu(openMenu === c.id ? null : c.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenu === c.id ? (
                    <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                      <Link
                        href={`/amud/admin/candidats/${c.id}`}
                        onClick={() => setOpenMenu(null)}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Voir la fiche
                      </Link>
                      {c.statut !== 'Actif' ? (
                        <button onClick={() => setStatutFor(c.id, 'Actif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Activer
                        </button>
                      ) : null}
                      {c.statut !== 'Inactif' ? (
                        <button onClick={() => setStatutFor(c.id, 'Inactif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Désactiver
                        </button>
                      ) : null}
                      {c.statut !== 'Bloqué' ? (
                        <button onClick={() => setStatutFor(c.id, 'Bloqué')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Bloquer
                        </button>
                      ) : (
                        <button onClick={() => setStatutFor(c.id, 'Actif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Débloquer
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setConfirmDeleteId(c.id);
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
                <td colSpan={7} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucun candidat ne correspond à ces filtres.
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
        title="Ajouter un candidat"
        subtitle="Renseignez les informations pour créer un nouveau profil candidat."
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-candidat-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Créer le profil
            </button>
          </div>
        }
      >
        <form id="add-candidat-form" onSubmit={handleAddCandidate} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet</label>
            <input
              autoFocus
              value={addNom}
              onChange={(e) => setAddNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Sophie Martin"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Email</label>
            <input
              value={addEmail}
              onChange={(e) => setAddEmail(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="s.martin@email.com"
              type="email"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
            <input
              value={addTelephone}
              onChange={(e) => setAddTelephone(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="+212 6 00 00 00 00"
              type="tel"
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
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste recherché</label>
            <input
              value={addPoste}
              onChange={(e) => setAddPoste(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Infirmier D.E."
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Disponibilité</label>
            <select
              value={addDisponibilite}
              onChange={(e) => setAddDisponibilite(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              {DISPONIBILITES.map((d) => (
                <option key={d}>{d}</option>
              ))}
            </select>
          </div>
          <div className="sm:col-span-2">
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Compétences (séparées par des virgules)</label>
            <input
              value={addCompetences}
              onChange={(e) => setAddCompetences(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Soins Intensifs, Bloc Opératoire"
              type="text"
            />
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeRow(confirmDeleteId)}
        title="Supprimer ce candidat ?"
        description="Cette action est irréversible. Le profil sera retiré de la liste des candidats."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
