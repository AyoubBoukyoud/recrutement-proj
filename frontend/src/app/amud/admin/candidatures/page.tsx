'use client';

import { useMemo, useState } from 'react';

type ColonneId = 'nouvelle' | 'preselection' | 'entretien' | 'shortlist';

type Candidat = {
  id: string;
  nom: string;
  poste: string;
  tags: string[];
  score: number;
  date: string;
  depuis: string;
  initiales: string;
};

const COLONNES: { id: ColonneId; label: string; dot: string }[] = [
  { id: 'nouvelle', label: 'Nouvelle', dot: 'bg-amud-surface-tint' },
  { id: 'preselection', label: 'Présélection', dot: 'bg-amud-secondary-container' },
  { id: 'entretien', label: 'Entretien', dot: 'bg-amud-tertiary-fixed-dim' },
  { id: 'shortlist', label: 'Shortlist', dot: 'bg-amud-primary-fixed-dim' },
];

const SEED: Record<ColonneId, Candidat[]> = {
  nouvelle: [
    { id: 'c1', nom: 'Sophie Martin', poste: 'Infirmier D.E.', tags: ['Soins Intensifs', 'Bloc Opératoire'], score: 95, date: '12/10/2023', depuis: 'Il y a 2h', initiales: 'SM' },
    { id: 'c2', nom: 'Lucas Moreau', poste: 'Électricien Ind.', tags: ['Haute Tension', 'Maintenance'], score: 82, date: '12/10/2023', depuis: 'Il y a 4h', initiales: 'LM' },
  ],
  preselection: [
    { id: 'c3', nom: 'Karim Bennani', poste: 'Chef de Chantier', tags: ['BTP', 'Management'], score: 98, date: '10/10/2023', depuis: '11/10/2023', initiales: 'KB' },
  ],
  entretien: [
    { id: 'c4', nom: 'Nadia Mansouri', poste: 'Data Scientist', tags: ['Python', 'AWS'], score: 91, date: '09/10/2023', depuis: 'Il y a 1j', initiales: 'NM' },
  ],
  shortlist: [
    { id: 'c5', nom: 'Youssef Amrani', poste: 'Full-Stack Developer', tags: ['Node.js', 'React'], score: 96, date: '05/10/2023', depuis: 'Il y a 3j', initiales: 'YA' },
  ],
};

export default function AmudAdminCandidaturesPage() {
  const [colonnes, setColonnes] = useState(SEED);
  const [search, setSearch] = useState('');
  const [vue, setVue] = useState<'kanban' | 'table'>('kanban');
  const [dragCard, setDragCard] = useState<{ id: string; from: ColonneId } | null>(null);

  function moveCard(id: string, from: ColonneId, to: ColonneId) {
    if (from === to) return;
    setColonnes((prev) => {
      const card = prev[from].find((c) => c.id === id);
      if (!card) return prev;
      return { ...prev, [from]: prev[from].filter((c) => c.id !== id), [to]: [...prev[to], card] };
    });
  }

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return colonnes;
    const out = {} as Record<ColonneId, Candidat[]>;
    (Object.keys(colonnes) as ColonneId[]).forEach((k) => {
      out[k] = colonnes[k].filter((c) => c.nom.toLowerCase().includes(q) || c.poste.toLowerCase().includes(q));
    });
    return out;
  }, [colonnes, search]);

  const totals = {
    total: Object.values(colonnes).reduce((s, arr) => s + arr.length, 0),
    nouvelle: colonnes.nouvelle.length,
    preselection: colonnes.preselection.length,
    entretien: colonnes.entretien.length,
    shortlist: colonnes.shortlist.length,
  };

  return (
    <div className="flex h-[calc(100vh-96px)] flex-col md:h-[calc(100vh-160px)]">
      <header className="mb-md flex shrink-0 flex-col gap-md">
        <div className="flex flex-col gap-md sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h2 className="text-headline-lg text-amud-on-surface">Gestion des candidatures</h2>
            <p className="mt-xs text-amud-on-surface-variant">Suivi et gestion du pipeline de recrutement.</p>
          </div>
          <div className="flex items-center gap-md">
            <div className="flex rounded-lg bg-amud-surface-container-low p-xs">
              <button
                onClick={() => setVue('kanban')}
                className={`flex items-center gap-xs rounded-md px-md py-xs text-label-md ${vue === 'kanban' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[18px]">view_kanban</span>
                <span className="hidden sm:inline">Vue </span>Kanban
              </button>
              <button
                onClick={() => setVue('table')}
                className={`flex items-center gap-xs rounded-md px-md py-xs text-label-md ${vue === 'table' ? 'bg-amud-surface text-amud-primary shadow-sm' : 'text-amud-on-surface-variant hover:bg-amud-surface-container-high'}`}
              >
                <span className="material-symbols-outlined text-[18px]">table_rows</span>
                <span className="hidden sm:inline">Vue </span>Tableau
              </button>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-sm md:grid-cols-5">
          {[
            { label: 'Total', value: totals.total },
            { label: 'Nouvelles', value: totals.nouvelle },
            { label: 'Présélection', value: totals.preselection },
            { label: 'Entretiens', value: totals.entretien },
            { label: 'Shortlist', value: totals.shortlist },
          ].map((k) => (
            <div key={k.label} className="flex flex-col items-center justify-center rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm">
              <span className="text-label-sm uppercase tracking-wider text-amud-outline">{k.label}</span>
              <span className="text-title-lg font-bold text-amud-on-surface">{k.value}</span>
            </div>
          ))}
        </div>
        <div className="flex items-center gap-sm rounded-lg border border-amud-surface-container-high bg-amud-surface-container-lowest p-sm shadow-sm">
          <div className="relative max-w-xs flex-1">
            <span className="material-symbols-outlined absolute left-sm top-1/2 -translate-y-1/2 text-amud-outline">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-md border border-amud-outline-variant bg-amud-surface-container-lowest py-sm pl-xl pr-sm text-body-md outline-none transition-all focus:border-amud-primary focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher un candidat…"
              type="text"
            />
          </div>
          <span className="text-label-sm text-amud-on-surface-variant">{Object.values(filtered).reduce((s, a) => s + a.length, 0)} résultat(s)</span>
        </div>
      </header>

      {vue === 'kanban' ? (
        <div className="min-h-0 flex-1 snap-x snap-mandatory overflow-x-auto rounded-lg bg-amud-surface-container-low">
          <div className="flex h-full w-max gap-md p-md">
            {COLONNES.map((col) => (
              <div
                key={col.id}
                onDragOver={(e) => e.preventDefault()}
                onDrop={() => {
                  if (dragCard) moveCard(dragCard.id, dragCard.from, col.id);
                  setDragCard(null);
                }}
                className="flex w-[85vw] shrink-0 snap-start flex-col rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest sm:w-80"
              >
                <div className="flex items-center justify-between rounded-t-lg border-b border-amud-outline-variant bg-amud-surface-container-high p-sm">
                  <h3 className="flex items-center gap-sm text-title-lg text-amud-on-surface">
                    <div className={`h-3 w-3 rounded-full ${col.dot}`} />
                    {col.label}
                  </h3>
                  <span className="rounded bg-amud-surface px-xs py-[2px] text-label-sm text-amud-outline">{filtered[col.id].length}</span>
                </div>
                <div className="flex flex-1 flex-col gap-sm overflow-y-auto p-sm">
                  {filtered[col.id].map((c) => (
                    <div
                      key={c.id}
                      draggable
                      onDragStart={() => setDragCard({ id: c.id, from: col.id })}
                      className="group relative cursor-grab rounded-lg border border-amud-outline-variant bg-amud-surface p-sm shadow-sm transition-colors hover:border-amud-primary active:cursor-grabbing"
                    >
                      <div className="mb-sm flex items-start justify-between">
                        <div className="flex items-center gap-sm">
                          <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amud-surface-container-highest bg-amud-surface-container-highest font-bold text-amud-primary">
                            {c.initiales}
                          </div>
                          <div>
                            <h4 className="text-label-md font-semibold text-amud-on-surface">{c.nom}</h4>
                            <p className="text-label-sm text-amud-outline">{c.poste}</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-[2px] rounded bg-amud-primary-fixed px-xs py-[2px] text-label-sm font-semibold text-amud-on-primary-fixed">
                          <span className="material-symbols-outlined text-[14px]">bolt</span>
                          {c.score}%
                        </div>
                      </div>
                      <div className="mb-sm flex flex-wrap gap-xs">
                        {c.tags.map((t) => (
                          <span key={t} className="rounded bg-amud-surface-container-highest px-xs py-[2px] text-[11px] font-medium text-amud-on-surface-variant">
                            {t}
                          </span>
                        ))}
                      </div>
                      <div className="flex items-center justify-between text-[11px] text-amud-outline">
                        <span className="flex items-center gap-[2px]">
                          <span className="material-symbols-outlined text-[14px]">calendar_today</span> {c.date}
                        </span>
                        <span className="flex items-center gap-[2px]">
                          <span className="material-symbols-outlined text-[14px]">history</span> {c.depuis}
                        </span>
                      </div>
                    </div>
                  ))}
                  {filtered[col.id].length === 0 ? (
                    <div className="flex flex-1 flex-col items-center justify-center p-md text-center text-amud-outline">
                      <span className="material-symbols-outlined mb-sm text-display-lg">inbox</span>
                      <p className="text-label-sm">Glissez une carte ici.</p>
                    </div>
                  ) : null}
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="min-h-0 flex-1 overflow-auto rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead className="sticky top-0 bg-amud-surface-container-low text-label-sm text-amud-on-surface-variant">
              <tr>
                <th className="p-sm">Candidat</th>
                <th className="p-sm">Poste</th>
                <th className="p-sm">Statut</th>
                <th className="p-sm">Score</th>
                <th className="p-sm">Date</th>
              </tr>
            </thead>
            <tbody>
              {COLONNES.flatMap((col) =>
                filtered[col.id].map((c) => (
                  <tr key={c.id} className="border-t border-amud-outline-variant hover:bg-amud-surface-container-low">
                    <td className="p-sm font-medium text-amud-on-surface">{c.nom}</td>
                    <td className="p-sm text-amud-on-surface-variant">{c.poste}</td>
                    <td className="p-sm">
                      <span className="inline-flex items-center gap-1 text-label-sm text-amud-on-surface-variant">
                        <span className={`h-2 w-2 rounded-full ${col.dot}`} /> {col.label}
                      </span>
                    </td>
                    <td className="p-sm text-amud-primary">{c.score}%</td>
                    <td className="p-sm text-amud-on-surface-variant">{c.date}</td>
                  </tr>
                )),
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
