'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { Drawer } from '@/components/amud/ui';
import { Pagination } from '@/components/Pagination';

/*
 * Journal d'audit — porte le style de la maquette
 * `/amud/admin/journal-activite` (recherche/filtres, tableau, tiroir de
 * détail) sur le vrai backend (`GET /admin/activity`, `AdminActivityLog`).
 * Contrairement à la maquette (rôle, module, résultat succès/échec, IP —
 * aucun de ces champs n'existe côté serveur), les seuls filtres réels sont
 * `action` (égalité stricte) et `actor_id` ; le détail affiche le `meta` brut
 * enregistré par chaque contrôleur plutôt qu'un diff avant/après générique.
 */
type ActivityEvent = {
  id: number;
  action: string;
  subject_type: string;
  subject_id: number;
  meta: Record<string, unknown> | null;
  created_at: string;
  actor: { name: string | null; phone: string } | null;
};

function subjectLabel(type: string) {
  return type.split('\\').pop() ?? type;
}

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export default function AdminJournalPage() {
  const [actionInput, setActionInput] = useState('');
  const [action, setAction] = useState('');
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<ActivityEvent | null>(null);

  const activity = useQuery({
    queryKey: ['admin-activity', action, page],
    queryFn: () =>
      api.get('/admin/activity', { params: { action: action || undefined, page } }).then((r) => r.data as Page<ActivityEvent>),
  });

  function submitFilter(e: React.FormEvent) {
    e.preventDefault();
    setAction(actionInput.trim());
    setPage(1);
  }

  const rows = activity.data?.data ?? [];

  return (
    <div>
      <div className="mb-lg flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Journal d’activité</h2>
          <p className="mt-1 max-w-2xl text-body-md text-amud-on-surface-variant">
            Actions effectuées par les administrateurs sur les dossiers, offres, comptes et réclamations.
          </p>
        </div>
      </div>

      <form onSubmit={submitFilter} className="mb-md flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={actionInput}
            onChange={(e) => setActionInput(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Filtrer par action exacte (ex. status_changed, verified…)"
            type="text"
          />
        </div>
        <button type="submit" className="w-full rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low md:w-auto">
          Filtrer
        </button>
      </form>

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[640px] border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                <th className="px-6 py-4">Date &amp; heure</th>
                <th className="px-6 py-4">Acteur</th>
                <th className="px-6 py-4">Action</th>
                <th className="px-6 py-4">Sujet</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amud-outline-variant">
              {activity.isLoading ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                    Chargement…
                  </td>
                </tr>
              ) : null}
              {!activity.isLoading && rows.length === 0 ? (
                <tr>
                  <td colSpan={4} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                    Aucun évènement ne correspond à ces filtres.
                  </td>
                </tr>
              ) : null}
              {rows.map((e) => {
                const actorName = e.actor?.name?.trim() || e.actor?.phone || 'Système';
                return (
                  <tr key={e.id} onClick={() => setSelected(e)} className="cursor-pointer transition-colors hover:bg-amud-surface-container-lowest/50">
                    <td className="whitespace-nowrap px-6 py-4 text-body-md text-amud-on-surface-variant">
                      {new Date(e.created_at).toLocaleDateString('fr-FR')}
                      <br />
                      <span className="text-label-sm">{new Date(e.created_at).toLocaleTimeString('fr-FR')}</span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-amud-primary-container text-[11px] font-bold text-amud-primary">
                          {initials(actorName)}
                        </div>
                        <span className="text-body-md text-amud-on-surface">{actorName}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 font-mono text-label-sm text-amud-on-surface">{e.action}</td>
                    <td className="px-6 py-4 text-body-md text-amud-on-surface-variant">
                      {subjectLabel(e.subject_type)} #{e.subject_id}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-md">
        <Pagination page={page} data={activity.data} onPage={setPage} noun="évènement" />
      </div>

      <Drawer open={selected !== null} onClose={() => setSelected(null)} title="Détail de l’évènement" subtitle={selected ? `#${selected.id}` : undefined}>
        {selected ? (
          <div className="flex flex-col gap-lg">
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Date &amp; heure</span>
                  <span className="text-body-md font-medium text-amud-on-surface">{new Date(selected.created_at).toLocaleString('fr-FR')}</span>
                </div>
                <div>
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Acteur</span>
                  <span className="text-body-md font-medium text-amud-on-surface">{selected.actor?.name?.trim() || selected.actor?.phone || 'Système'}</span>
                </div>
                <div className="col-span-2">
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Sujet</span>
                  <span className="text-body-md font-medium text-amud-primary">
                    {subjectLabel(selected.subject_type)} #{selected.subject_id}
                  </span>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md uppercase tracking-wide text-amud-on-surface">Action</h4>
              <p className="font-mono text-label-md text-amud-on-surface">{selected.action}</p>
            </div>

            {selected.meta && Object.keys(selected.meta).length > 0 ? (
              <div>
                <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md uppercase tracking-wide text-amud-on-surface">Détails</h4>
                <div className="overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-bright">
                  {Object.entries(selected.meta).map(([key, value]) => (
                    <div key={key} className="flex items-start justify-between gap-md border-b border-amud-outline-variant p-2 text-label-md last:border-0">
                      <span className="text-amud-on-surface-variant">{key}</span>
                      <span className="text-right font-mono text-amud-on-surface">{value === null ? '—' : String(value)}</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <p className="text-label-md italic text-amud-on-surface-variant">Aucun détail supplémentaire pour cet évènement.</p>
            )}
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
