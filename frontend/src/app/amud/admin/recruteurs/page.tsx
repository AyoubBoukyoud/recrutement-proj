'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ConfirmDialog, Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { STATUT_CLASS, recruitersSeed, type Recruiter, type StatutRecruteur } from '@/data/amud/recruiters';
import { recruitersCollection } from '@/lib/amud/localRecruiters';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { generateId } from '@/lib/amud/storage/ids';
import { entreprisesSeed } from '@/data/amud/entreprises';

const PAGE_SIZE = 6;
type SortKey = 'nom' | 'entreprise' | 'creeLe';

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

export default function AmudAdminRecruteursPage() {
  const notify = useToast();
  const [recruiters, { add: addRecruiter, update: updateRecruiter, remove: removeRecruiter }] = useCollection(recruitersCollection, recruitersSeed);
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
  const [addPoste, setAddPoste] = useState('');
  const [addVille, setAddVille] = useState('');
  const [addEntrepriseId, setAddEntrepriseId] = useState(entreprisesSeed[0]?.id ?? '');

  function resetAddForm() {
    setAddNom('');
    setAddEmail('');
    setAddTelephone('');
    setAddPoste('');
    setAddVille('');
    setAddEntrepriseId(entreprisesSeed[0]?.id ?? '');
  }

  function handleAddRecruiter(e: React.FormEvent) {
    e.preventDefault();
    if (!addNom.trim() || !addEmail.trim() || !addEmail.includes('@') || !addEntrepriseId) return;
    const entreprise = entreprisesSeed.find((en) => en.id === addEntrepriseId);
    const r: Recruiter = {
      id: generateId('recruiter'),
      nom: addNom.trim(),
      email: addEmail.trim(),
      telephone: addTelephone.trim(),
      poste: addPoste.trim() || '—',
      entrepriseId: addEntrepriseId,
      entrepriseNom: entreprise ? entreprise.nom : '—',
      ville: addVille.trim() || entreprise?.ville || '—',
      statut: 'Actif',
      verifie: false,
      creeLe: todayFr(),
      dernierAcces: "Aujourd'hui",
    };
    addRecruiter(r);
    notify(`« ${r.nom} » ajouté aux recruteurs.`);
    setAddOpen(false);
    resetAddForm();
  }

  const villes = useMemo(() => Array.from(new Set(recruiters.map((r) => r.ville))).sort(), [recruiters]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const rows = recruiters.filter(
      (r) =>
        (!q || r.nom.toLowerCase().includes(q) || r.email.toLowerCase().includes(q) || r.entrepriseNom.toLowerCase().includes(q)) &&
        (!ville || r.ville === ville) &&
        (!statut || r.statut === statut),
    );
    return [...rows].sort((a, b) => {
      if (sort === 'entreprise') return a.entrepriseNom.localeCompare(b.entrepriseNom);
      if (sort === 'creeLe') return b.creeLe.localeCompare(a.creeLe);
      return a.nom.localeCompare(b.nom);
    });
  }, [recruiters, search, ville, statut, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const kpis = [
    { label: 'Total recruteurs', value: recruiters.length, accent: 'bg-amud-primary' },
    { label: 'Actifs', value: recruiters.filter((r) => r.statut === 'Actif').length, accent: 'bg-amud-primary-container' },
    { label: 'Vérifiés', value: recruiters.filter((r) => r.verifie).length, accent: 'bg-amud-tertiary-fixed-dim' },
    { label: 'Bloqués', value: recruiters.filter((r) => r.statut === 'Bloqué').length, accent: 'bg-amud-error' },
  ];

  function resetPage() {
    setPage(1);
  }

  function setStatutFor(id: string, next: StatutRecruteur) {
    const r = recruiters.find((x) => x.id === id);
    updateRecruiter(id, { statut: next });
    setOpenMenu(null);
    notify(r ? `Statut de « ${r.nom} » mis à jour : ${next}.` : 'Statut mis à jour.');
  }

  function toggleVerifie(id: string) {
    const r = recruiters.find((x) => x.id === id);
    if (!r) return;
    updateRecruiter(id, { verifie: !r.verifie });
    setOpenMenu(null);
    notify(!r.verifie ? `« ${r.nom} » a été vérifié.` : `Vérification retirée pour « ${r.nom} ».`);
  }

  function removeRow(id: string) {
    const r = recruiters.find((x) => x.id === id);
    removeRecruiter(id);
    setOpenMenu(null);
    notify(r ? `« ${r.nom} » supprimé.` : 'Recruteur supprimé.', 'info');
  }

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Recruteurs</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les comptes recruteurs rattachés aux entreprises partenaires.</p>
        </div>
        <button
          onClick={() => setAddOpen(true)}
          className="flex items-center gap-2 whitespace-nowrap rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined">add</span>
          Ajouter un recruteur
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
            placeholder="Rechercher par nom, email ou entreprise…"
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
            <option value="entreprise">Trier : Entreprise</option>
            <option value="creeLe">Trier : Date d&apos;inscription</option>
          </select>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Recruteur</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant lg:table-cell">Entreprise</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Ville</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Vérifié</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant xl:table-cell">Dernier accès</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {paged.map((r) => (
              <tr key={r.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <Link href={`/amud/admin/recruteurs/${r.id}`} className="group flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-sm font-bold text-white">
                      {initials(r.nom)}
                    </div>
                    <div>
                      <p className="font-semibold text-amud-on-surface transition-colors group-hover:text-amud-primary">{r.nom}</p>
                      <p className="text-label-sm text-amud-on-surface-variant">{r.poste}</p>
                    </div>
                  </Link>
                </td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant lg:table-cell">{r.entrepriseNom}</td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{r.ville}</td>
                <td className="hidden px-6 py-4 text-center sm:table-cell">
                  {r.verifie ? (
                    <span className="inline-flex items-center gap-1 text-amud-primary" title="Vérifié">
                      <span className="material-symbols-outlined text-[18px]" style={{ fontVariationSettings: "'FILL' 1" }}>
                        verified
                      </span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1 text-amud-outline" title="Non vérifié">
                      <span className="material-symbols-outlined text-[18px]">gpp_maybe</span>
                    </span>
                  )}
                </td>
                <td className="px-6 py-4">
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUT_CLASS[r.statut]}`}>{r.statut}</span>
                </td>
                <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant xl:table-cell">{r.dernierAcces}</td>
                <td className="relative px-6 py-4 text-right">
                  <button onClick={() => setOpenMenu(openMenu === r.id ? null : r.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
                  {openMenu === r.id ? (
                    <div className="absolute right-6 top-12 z-10 w-52 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                      <Link
                        href={`/amud/admin/recruteurs/${r.id}`}
                        onClick={() => setOpenMenu(null)}
                        className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                      >
                        Voir la fiche
                      </Link>
                      <button onClick={() => toggleVerifie(r.id)} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                        {r.verifie ? 'Retirer la vérification' : 'Vérifier'}
                      </button>
                      {r.statut !== 'Actif' ? (
                        <button onClick={() => setStatutFor(r.id, 'Actif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Activer
                        </button>
                      ) : null}
                      {r.statut !== 'Inactif' ? (
                        <button onClick={() => setStatutFor(r.id, 'Inactif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Désactiver
                        </button>
                      ) : null}
                      {r.statut !== 'Bloqué' ? (
                        <button onClick={() => setStatutFor(r.id, 'Bloqué')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Bloquer
                        </button>
                      ) : (
                        <button onClick={() => setStatutFor(r.id, 'Actif')} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                          Débloquer
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setConfirmDeleteId(r.id);
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
                  Aucun recruteur ne correspond à ces filtres.
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
        title="Ajouter un recruteur"
        subtitle="Renseignez les informations pour créer un nouveau compte recruteur, rattaché à une entreprise partenaire."
        footer={
          <div className="flex justify-end gap-sm">
            <button type="button" onClick={() => setAddOpen(false)} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Annuler
            </button>
            <button type="submit" form="add-recruteur-form" className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
              Créer le compte
            </button>
          </div>
        }
      >
        <form id="add-recruteur-form" onSubmit={handleAddRecruiter} className="grid grid-cols-1 gap-md sm:grid-cols-2">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom complet</label>
            <input
              autoFocus
              value={addNom}
              onChange={(e) => setAddNom(e.target.value)}
              required
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Fatima Zahra"
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
              placeholder="f.zahra@entreprise.com"
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
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Poste</label>
            <input
              value={addPoste}
              onChange={(e) => setAddPoste(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Responsable RH"
              type="text"
            />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Entreprise de rattachement</label>
            <select
              value={addEntrepriseId}
              onChange={(e) => setAddEntrepriseId(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              {entreprisesSeed.map((en) => (
                <option key={en.id} value={en.id}>
                  {en.nom}
                </option>
              ))}
            </select>
          </div>
        </form>
      </Modal>

      <ConfirmDialog
        open={!!confirmDeleteId}
        onClose={() => setConfirmDeleteId(null)}
        onConfirm={() => confirmDeleteId && removeRow(confirmDeleteId)}
        title="Supprimer ce recruteur ?"
        description="Cette action est irréversible. Le compte sera retiré de la liste des recruteurs."
        confirmLabel="Supprimer"
      />
    </div>
  );
}
