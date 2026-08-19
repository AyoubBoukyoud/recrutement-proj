'use client';

import { useMemo, useState } from 'react';

type Statut = 'Vérifiée' | 'Active' | 'En attente' | 'Bloquée';

type Entreprise = {
  id: string;
  nom: string;
  icon: string;
  recruteurs: number;
  offres: number;
  candidatures: number;
  ville: string;
  secteur: string;
  statut: Statut;
  derniereActivite: string;
};

const SEED: Entreprise[] = [
  { id: '1', nom: 'TechCorp SA', icon: 'apartment', recruteurs: 4, offres: 12, candidatures: 145, ville: 'Casablanca', secteur: 'IT', statut: 'Vérifiée', derniereActivite: "Aujourd'hui" },
  { id: '2', nom: 'BuildIt Construction', icon: 'construction', recruteurs: 2, offres: 5, candidatures: 68, ville: 'Berlin', secteur: 'BTP', statut: 'Active', derniereActivite: 'Hier' },
  { id: '3', nom: 'MediCare Group', icon: 'local_hospital', recruteurs: 8, offres: 20, candidatures: 312, ville: 'Lyon', secteur: 'Santé', statut: 'En attente', derniereActivite: '12/10/2023' },
  { id: '4', nom: 'Klinikum Berlin', icon: 'medical_services', recruteurs: 3, offres: 9, candidatures: 88, ville: 'Berlin', secteur: 'Santé', statut: 'Active', derniereActivite: 'Il y a 2 jours' },
  { id: '5', nom: 'Innovate SA', icon: 'lightbulb', recruteurs: 5, offres: 14, candidatures: 176, ville: 'Casablanca', secteur: 'IT', statut: 'Vérifiée', derniereActivite: "Aujourd'hui" },
  { id: '6', nom: 'Logistics Pro', icon: 'local_shipping', recruteurs: 1, offres: 3, candidatures: 22, ville: 'Marrakech', secteur: 'Transport', statut: 'Bloquée', derniereActivite: '01/09/2023' },
  { id: '7', nom: 'Design Studio', icon: 'palette', recruteurs: 2, offres: 4, candidatures: 41, ville: 'Lyon', secteur: 'Design', statut: 'Active', derniereActivite: 'Il y a 5 jours' },
];

const STATUT_CLASS: Record<Statut, string> = {
  Vérifiée: 'bg-amud-primary-fixed-dim text-amud-on-primary-fixed-variant',
  Active: 'bg-amud-surface-container-highest text-amud-primary',
  'En attente': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant',
  Bloquée: 'bg-amud-error-container text-amud-on-error-container',
};

const PAGE_SIZE = 3;

export default function AmudAdminEntreprisesPage() {
  const [search, setSearch] = useState('');
  const [ville, setVille] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SEED.filter(
      (e) =>
        (!q || e.nom.toLowerCase().includes(q)) &&
        (!ville || e.ville === ville) &&
        (!secteur || e.secteur === secteur) &&
        (!statut || e.statut === statut),
    );
  }, [search, ville, secteur, statut]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  function applyFilters() {
    setPage(1);
  }

  const kpis = [
    { label: 'Total entreprises', value: SEED.length, accent: 'bg-amud-primary' },
    { label: 'Actives', value: SEED.filter((e) => e.statut === 'Active' || e.statut === 'Vérifiée').length, accent: 'bg-amud-primary-container' },
    { label: 'En attente', value: SEED.filter((e) => e.statut === 'En attente').length, accent: 'bg-amud-tertiary-fixed-dim' },
    { label: 'Vérifiées', value: SEED.filter((e) => e.statut === 'Vérifiée').length, accent: 'bg-amud-primary-fixed-dim' },
    { label: 'Bloquées', value: SEED.filter((e) => e.statut === 'Bloquée').length, accent: 'bg-amud-error' },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des entreprises</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez et suivez les entreprises partenaires.</p>
        </div>
        <button className="flex items-center gap-2 rounded-lg bg-amud-primary px-6 py-3 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark">
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
            <option>IT</option>
            <option>BTP</option>
            <option>Santé</option>
            <option>Transport</option>
            <option>Design</option>
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
              <tr key={e.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-amud-outline-variant bg-amud-surface">
                      <span className="material-symbols-outlined text-amud-primary">{e.icon}</span>
                    </div>
                    <span className="text-label-md font-semibold text-amud-on-surface">{e.nom}</span>
                  </div>
                </td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{e.recruteurs}</td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{e.offres}</td>
                <td className="px-6 py-4 text-center text-body-md text-amud-on-surface-variant">{e.candidatures}</td>
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
                <td className="px-6 py-4 text-right">
                  <button className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                    <span className="material-symbols-outlined">more_vert</span>
                  </button>
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
    </div>
  );
}
