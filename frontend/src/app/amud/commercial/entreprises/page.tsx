'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { STATUT_CLASS, entreprisesSeed, type Entreprise } from '@/data/amud/entreprises';
import { loadLocalEntreprises } from '@/lib/amud/localEntreprises';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';

const SECTEURS = ['IT', 'BTP', 'Santé', 'Transport', 'Design'];

export default function AmudCommercialEntreprisesPage() {
  const searchParams = useSearchParams();
  const [entreprises, setEntreprises] = useState<Entreprise[]>(entreprisesSeed);
  const [search, setSearch] = useState(() => searchParams.get('q') ?? '');
  const [ville, setVille] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [onlyMine, setOnlyMine] = useState(false);

  useEffect(() => {
    const extra = loadLocalEntreprises();
    if (extra.length) setEntreprises([...entreprisesSeed, ...extra]);
  }, []);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return entreprises.filter(
      (e) =>
        (!q || e.nom.toLowerCase().includes(q)) &&
        (!ville || e.ville === ville) &&
        (!secteur || e.secteur === secteur) &&
        (!statut || e.statut === statut) &&
        (!onlyMine || e.commercialResponsable === CURRENT_COMMERCIAL.nom),
    );
  }, [entreprises, search, ville, secteur, statut, onlyMine]);

  const kpis = [
    { label: 'Total entreprises', value: entreprises.length, accent: 'bg-amud-primary' },
    { label: 'Mes entreprises', value: entreprises.filter((e) => e.commercialResponsable === CURRENT_COMMERCIAL.nom).length, accent: 'bg-amud-secondary' },
    { label: 'Actives', value: entreprises.filter((e) => e.statut === 'Active' || e.statut === 'Vérifiée').length, accent: 'bg-amud-primary-container' },
    { label: 'En attente', value: entreprises.filter((e) => e.statut === 'En attente').length, accent: 'bg-amud-tertiary-fixed-dim' },
  ];

  return (
    <div>
      <div className="mb-8 flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Entreprises</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Consultez le portefeuille d&apos;entreprises partenaires et accédez à leur fiche détaillée.</p>
        </div>
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
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
            placeholder="Rechercher par nom d'entreprise…"
            type="text"
          />
        </div>
        <div className="flex w-full flex-wrap gap-2 overflow-x-auto pb-2 md:w-auto md:pb-0">
          <select value={ville} onChange={(e) => setVille(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2">
            <option value="">Ville</option>
            <option>Casablanca</option>
            <option>Berlin</option>
            <option>Lyon</option>
            <option>Marrakech</option>
          </select>
          <select value={secteur} onChange={(e) => setSecteur(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2">
            <option value="">Secteur</option>
            {SECTEURS.map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
          <select value={statut} onChange={(e) => setStatut(e.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary focus:ring-offset-2">
            <option value="">Statut</option>
            <option>Active</option>
            <option>Vérifiée</option>
            <option>En attente</option>
            <option>Bloquée</option>
          </select>
          <label className="flex shrink-0 cursor-pointer items-center gap-2 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 transition-colors hover:bg-amud-surface-container-low">
            <input type="checkbox" checked={onlyMine} onChange={(e) => setOnlyMine(e.target.checked)} className="h-4 w-4 rounded border-amud-outline text-amud-primary focus:ring-amud-primary" />
            <span className="text-label-sm text-amud-on-surface">Mes entreprises</span>
          </label>
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Entreprise</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Offres actives</th>
              <th className="px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Candidatures</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Ville / Secteur</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Responsable</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {filtered.map((e) => (
              <tr key={e.id} className="animate-amud-rise-in transition-colors hover:bg-amud-surface-container-lowest/50">
                <td className="px-6 py-4">
                  <Link href={`/amud/commercial/entreprises/${e.id}`} className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded border border-amud-outline-variant bg-amud-surface">
                      <span className="material-symbols-outlined text-amud-primary">{e.icon}</span>
                    </div>
                    <span className="text-label-md font-semibold text-amud-on-surface hover:text-amud-primary">{e.nom}</span>
                  </Link>
                </td>
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
                <td className="px-6 py-4">
                  <span className={`text-body-md ${e.commercialResponsable === CURRENT_COMMERCIAL.nom ? 'font-semibold text-amud-primary' : 'text-amud-on-surface-variant'}`}>
                    {e.commercialResponsable ?? '—'}
                  </span>
                </td>
                <td className="px-6 py-4 text-right">
                  <Link
                    href={`/amud/commercial/entreprises/${e.id}`}
                    className="inline-flex items-center gap-1 rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm text-amud-primary transition-colors hover:bg-amud-surface-container-low"
                  >
                    Voir la fiche <span className="material-symbols-outlined text-[16px]">chevron_right</span>
                  </Link>
                </td>
              </tr>
            ))}
            {filtered.length === 0 ? (
              <tr>
                <td colSpan={7} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucune entreprise ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </div>
  );
}
