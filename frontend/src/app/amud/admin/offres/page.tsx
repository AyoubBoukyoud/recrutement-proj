'use client';

import { useMemo, useState } from 'react';

type Statut = 'Brouillon' | 'En attente' | 'Publiée' | 'Expirée' | 'Refusée';

type Offre = {
  id: string;
  titre: string;
  entreprise: string;
  recruteur: string;
  ville: string;
  contrat: string;
  candidatures: number | null;
  publication: string;
  statut: Statut;
};

const SEED: Offre[] = [
  { id: '1', titre: 'Infirmier en soins intensifs', entreprise: 'Klinikum Berlin', recruteur: 'Sophie Martin', ville: 'Berlin, DE', contrat: 'CDI', candidatures: null, publication: 'En attente', statut: 'En attente' },
  { id: '2', titre: 'Développeur Fullstack React/Node', entreprise: 'TechCorp SA', recruteur: 'Marc Dubois', ville: 'Paris, FR', contrat: 'CDI', candidatures: 18, publication: '12/10/2023', statut: 'Publiée' },
  { id: '3', titre: 'Chef de Chantier', entreprise: 'BuildIt Construction', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDD', candidatures: null, publication: '-', statut: 'Brouillon' },
  { id: '4', titre: 'Data Scientist', entreprise: 'Innovate SA', recruteur: 'Karim Bennani', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 32, publication: '08/10/2023', statut: 'Publiée' },
  { id: '5', titre: 'Ingénieur Cloud Senior', entreprise: 'TechCorp SA', recruteur: 'Marc Dubois', ville: 'Casablanca, MA', contrat: 'CDI', candidatures: 9, publication: '20/09/2023', statut: 'Expirée' },
  { id: '6', titre: 'UX Designer', entreprise: 'Design Studio', recruteur: 'Alice Lemoine', ville: 'Lyon, FR', contrat: 'CDI', candidatures: null, publication: '-', statut: 'Refusée' },
];

const STATUT_CLASS: Record<Statut, string> = {
  'En attente': 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  Publiée: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  Brouillon: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Expirée: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  Refusée: 'bg-amud-error-container text-amud-on-error-container',
};

export default function AmudAdminOffresPage() {
  const [entreprise, setEntreprise] = useState('');
  const [secteur, setSecteur] = useState('');
  const [statut, setStatut] = useState('');
  const [applied, setApplied] = useState({ entreprise: '', secteur: '', statut: '' });
  const [selected, setSelected] = useState<string[]>([]);

  const filtered = useMemo(() => {
    return SEED.filter(
      (o) => (!applied.entreprise || o.entreprise === applied.entreprise) && (!applied.statut || o.statut === applied.statut),
    );
  }, [applied]);

  const kpis: { label: string; value: number; cls: string }[] = [
    { label: 'Total', value: SEED.length, cls: 'text-amud-on-surface' },
    { label: 'Brouillons', value: SEED.filter((o) => o.statut === 'Brouillon').length, cls: 'text-amud-on-surface-variant' },
    { label: 'En attente', value: SEED.filter((o) => o.statut === 'En attente').length, cls: 'text-amud-tertiary' },
    { label: 'Publiées', value: SEED.filter((o) => o.statut === 'Publiée').length, cls: 'text-amud-primary' },
    { label: 'Expirées', value: SEED.filter((o) => o.statut === 'Expirée').length, cls: 'text-amud-on-surface' },
    { label: 'Refusées', value: SEED.filter((o) => o.statut === 'Refusée').length, cls: 'text-amud-error' },
  ];

  return (
    <div>
      <div className="mb-xl flex items-end justify-between">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des offres</h2>
          <p className="mt-sm text-body-md text-amud-on-surface-variant">Gérez et suivez le statut de toutes les offres d&apos;emploi sur la plateforme.</p>
        </div>
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
              {Array.from(new Set(SEED.map((o) => o.entreprise))).map((e) => (
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
              <option>Brouillon</option>
              <option>En attente</option>
              <option>Publiée</option>
              <option>Expirée</option>
              <option>Refusée</option>
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
          <button
            disabled={!selected.length}
            className="rounded bg-amud-outline-variant bg-opacity-20 px-3 py-1 text-label-sm text-amud-on-surface-variant disabled:cursor-not-allowed"
          >
            Actions en masse
          </button>
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
                <tr key={o.id} className="group border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-lowest">
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
                  <td className="p-md text-right">
                    <button className="text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
