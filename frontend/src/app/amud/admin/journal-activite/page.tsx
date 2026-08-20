'use client';

import { useMemo, useState } from 'react';
import { Drawer } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { exportCsv } from '@/lib/amud/csv';

type Role = 'Admin' | 'Commercial' | 'Recruteur';
type Resultat = 'Succès' | 'Échec';

type LogEntry = {
  id: string;
  date: string;
  heure: string;
  utilisateur: string;
  role: Role | 'N/A';
  action: string;
  actionType: 'create' | 'update' | 'disable' | 'login_failed';
  module: string;
  reference: string;
  ip: string;
  localisation: string;
  resultat: Resultat;
  diff?: { before: string; after: string };
};

const SEED: LogEntry[] = [
  {
    id: 'log1',
    date: '12/10/2023',
    heure: '14:30:22',
    utilisateur: 'Admin Ahmed',
    role: 'Admin',
    action: 'Création de commercial',
    actionType: 'create',
    module: 'Utilisateurs',
    reference: 'Jean Dupont (#492)',
    ip: '192.168.1.1',
    localisation: 'Casablanca, Maroc',
    resultat: 'Succès',
  },
  {
    id: 'log2',
    date: '12/10/2023',
    heure: '11:15:05',
    utilisateur: 'Recruteur Mohamed',
    role: 'Recruteur',
    action: "Modification d'offre",
    actionType: 'update',
    module: 'Offres',
    reference: 'Infirmier Berlin (#1042)',
    ip: '172.16.0.42',
    localisation: 'Paris, France',
    resultat: 'Succès',
    diff: { before: '"salary_max": 45000,\n"status": "draft"', after: '"salary_max": 52000,\n"status": "published"' },
  },
  {
    id: 'log3',
    date: '11/10/2023',
    heure: '16:45:50',
    utilisateur: 'Admin Sara',
    role: 'Admin',
    action: 'Désactivation de compte',
    actionType: 'disable',
    module: 'Utilisateurs',
    reference: 'Lucas Renard (#221)',
    ip: '82.10.4.15',
    localisation: 'Lyon, France',
    resultat: 'Succès',
  },
  {
    id: 'log4',
    date: '11/10/2023',
    heure: '09:12:01',
    utilisateur: 'Utilisateur Inconnu',
    role: 'N/A',
    action: 'Tentative de connexion',
    actionType: 'login_failed',
    module: 'Système',
    reference: '-',
    ip: '198.51.100.14',
    localisation: 'Inconnue',
    resultat: 'Échec',
  },
  {
    id: 'log5',
    date: '10/10/2023',
    heure: '08:03:44',
    utilisateur: 'Commercial Jean Dupont',
    role: 'Commercial',
    action: "Mise à jour d'activité CRM",
    actionType: 'update',
    module: 'CRM',
    reference: 'Marie Laurent (#3312)',
    ip: '90.12.4.201',
    localisation: 'Paris, France',
    resultat: 'Succès',
    diff: { before: '"statut": "nouveau"', after: '"statut": "positif"' },
  },
];

const ROLE_CHIPS: Role[] = ['Admin', 'Commercial', 'Recruteur'];
const MODULE_CHIPS = ['Utilisateurs', 'Offres', 'CRM'];

export default function AmudAdminJournalActivitePage() {
  const notify = useToast();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<Role | null>(null);
  const [moduleFilter, setModuleFilter] = useState<string | null>(null);
  const [statutFilter, setStatutFilter] = useState('Tous les statuts');
  const [selected, setSelected] = useState<LogEntry | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return SEED.filter(
      (l) =>
        (!q || l.utilisateur.toLowerCase().includes(q) || l.action.toLowerCase().includes(q)) &&
        (!roleFilter || l.role === roleFilter) &&
        (!moduleFilter || l.module === moduleFilter) &&
        (statutFilter === 'Tous les statuts' || l.resultat === statutFilter),
    );
  }, [search, roleFilter, moduleFilter, statutFilter]);

  return (
    <div className="flex flex-col">
      <div className="mb-xl flex flex-col items-start justify-between gap-md md:flex-row md:items-end">
        <div>
          <h1 className="mb-2 text-headline-lg text-amud-on-surface">Journal d&apos;activité</h1>
          <p className="max-w-2xl text-body-md text-amud-on-surface-variant">
            Suivez et auditez l&apos;ensemble des actions effectuées sur la plateforme pour garantir la sécurité et la traçabilité.
          </p>
        </div>
        <button
          onClick={() => {
            exportCsv(
              'journal-activite',
              filtered.map((l) => ({ Date: l.date, Heure: l.heure, Utilisateur: l.utilisateur, Rôle: l.role, Action: l.action, Module: l.module, Référence: l.reference, IP: l.ip, Résultat: l.resultat })),
            );
            notify('Logs exportés.');
          }}
          className="flex shrink-0 items-center gap-sm rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-primary transition-colors hover:bg-amud-surface-container-low"
        >
          <span className="material-symbols-outlined">download</span>
          Exporter les logs
        </button>
      </div>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface p-lg shadow-sm">
        <div className="mb-md grid grid-cols-1 gap-md md:grid-cols-2 lg:grid-cols-4">
          <div className="relative lg:col-span-2">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-bright py-2 pl-10 pr-4 text-body-md outline-none focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
              placeholder="Rechercher par utilisateur ou action…"
              type="text"
            />
          </div>
          <select className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface-bright px-4 py-2 text-body-md text-amud-on-surface outline-none focus:border-amud-primary focus:ring-1 focus:ring-amud-primary">
            <option>7 derniers jours</option>
            <option>30 derniers jours</option>
            <option>Ce mois-ci</option>
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="w-full appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface-bright px-4 py-2 text-body-md text-amud-on-surface outline-none focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
          >
            <option>Tous les statuts</option>
            <option>Succès</option>
            <option>Échec</option>
          </select>
        </div>
        <div className="flex flex-wrap gap-md">
          <div className="flex flex-wrap items-center gap-sm">
            <span className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Rôle:</span>
            <div className="flex flex-wrap gap-2">
              {ROLE_CHIPS.map((r) => (
                <button
                  key={r}
                  onClick={() => setRoleFilter(roleFilter === r ? null : r)}
                  className={`rounded-full border px-3 py-1 text-label-sm transition-colors ${
                    roleFilter === r ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant bg-amud-surface-container-low text-amud-on-surface hover:bg-amud-surface-container'
                  }`}
                >
                  {r}
                </button>
              ))}
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-sm">
            <span className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Module:</span>
            <div className="flex flex-wrap gap-2">
              {MODULE_CHIPS.map((m) => (
                <button
                  key={m}
                  onClick={() => setModuleFilter(moduleFilter === m ? null : m)}
                  className={`rounded-full border px-3 py-1 text-label-sm transition-colors ${
                    moduleFilter === m ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant bg-amud-surface-container-low text-amud-on-surface hover:bg-amud-surface-container'
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>

      <div className="min-w-0 flex-1 overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
                <th className="p-md font-medium">Date &amp; Heure</th>
                <th className="p-md font-medium">Utilisateur</th>
                <th className="p-md font-medium">Action</th>
                <th className="p-md font-medium">Module / Réf</th>
                <th className="p-md font-medium">IP</th>
                <th className="p-md text-right font-medium">Résultat</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-amud-on-surface">
              {filtered.map((l) => (
                <tr key={l.id} onClick={() => setSelected(l)} className="group cursor-pointer border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-lowest">
                  <td className="whitespace-nowrap p-md text-amud-on-surface-variant">
                    {l.date}
                    <br />
                    <span className="text-label-sm">{l.heure}</span>
                  </td>
                  <td className="p-md">
                    <div className="font-medium text-amud-on-surface">{l.utilisateur}</div>
                    <div className="text-label-sm text-amud-on-surface-variant">{l.role}</div>
                  </td>
                  <td className="p-md">
                    <div className="font-medium">{l.action}</div>
                    <div className="text-label-sm text-amud-on-surface-variant">Action: {l.actionType}</div>
                  </td>
                  <td className="p-md">
                    <div>{l.module}</div>
                    <div className="text-label-sm font-medium text-amud-primary">{l.reference}</div>
                  </td>
                  <td className="p-md font-mono text-label-sm text-amud-on-surface-variant">{l.ip}</td>
                  <td className="p-md text-right">
                    {l.resultat === 'Succès' ? (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amud-primary-container px-2.5 py-0.5 text-label-sm font-medium text-white">
                        <span className="material-symbols-outlined text-[14px]">check_circle</span>
                        Succès
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amud-error-container px-2.5 py-0.5 text-label-sm font-medium text-amud-on-error-container">
                        <span className="material-symbols-outlined text-[14px]">error</span>
                        Échec
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-amud-outline-variant bg-amud-surface-container-lowest p-md">
          <span className="text-label-sm text-amud-on-surface-variant">Affichage 1 à {filtered.length} sur {SEED.length} entrées</span>
        </div>
      </div>

      <Drawer
        open={!!selected}
        onClose={() => setSelected(null)}
        title="Détails de l'événement"
        subtitle={selected ? `ID: ${selected.id}` : undefined}
      >
        {selected ? (
          <div className="flex flex-col gap-lg">
            <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-low p-md">
              <div className="grid grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Date &amp; Heure</span>
                  <span className="text-body-md font-medium text-amud-on-surface">
                    {selected.date}, {selected.heure}
                  </span>
                </div>
                <div>
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Statut</span>
                  <span
                    className={`inline-flex items-center gap-1 rounded px-2 py-0.5 text-label-sm font-medium ${
                      selected.resultat === 'Succès' ? 'bg-amud-primary-container text-white' : 'bg-amud-error-container text-amud-on-error-container'
                    }`}
                  >
                    {selected.resultat}
                  </span>
                </div>
                <div className="col-span-2">
                  <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Acteur</span>
                  <div className="flex items-center gap-sm">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-amud-primary-container text-[10px] font-bold text-white">
                      {selected.utilisateur.slice(0, 2).toUpperCase()}
                    </div>
                    <span className="text-body-md text-amud-on-surface">{selected.utilisateur}</span>
                  </div>
                </div>
              </div>
            </div>

            <div>
              <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md uppercase tracking-wide text-amud-on-surface">Contexte de l&apos;action</h4>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-label-md text-amud-on-surface-variant">Type d&apos;action</span>
                  <span className="font-mono text-label-md font-medium text-amud-on-surface">{selected.actionType.toUpperCase()}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-md text-amud-on-surface-variant">Module concerné</span>
                  <span className="text-label-md font-medium text-amud-on-surface">{selected.module}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-label-md text-amud-on-surface-variant">Enregistrement cible</span>
                  <span className="text-label-md font-medium text-amud-primary">{selected.reference}</span>
                </div>
              </div>
            </div>

            {selected.diff ? (
              <div>
                <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md uppercase tracking-wide text-amud-on-surface">Modifications de données</h4>
                <div className="overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-bright font-mono text-sm">
                  <div className="grid grid-cols-2 border-b border-amud-outline-variant bg-amud-surface-container-low p-2 text-xs text-amud-on-surface-variant">
                    <div>Avant</div>
                    <div className="border-l border-amud-outline-variant pl-2">Après</div>
                  </div>
                  <div className="grid grid-cols-2 gap-x-2 p-2">
                    <div className="whitespace-pre-wrap break-all rounded bg-amud-error-container/30 p-1 text-amud-error">{selected.diff.before}</div>
                    <div className="whitespace-pre-wrap break-all rounded border-l border-amud-outline-variant bg-amud-primary-container/20 p-1 pl-2 text-amud-primary-container">
                      {selected.diff.after}
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-label-md italic text-amud-on-surface-variant">Aucune modification de champ associée à cet événement.</p>
            )}

            <div>
              <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md uppercase tracking-wide text-amud-on-surface">Détails techniques</h4>
              <div className="space-y-3">
                <div>
                  <span className="block text-label-sm text-amud-on-surface-variant">Adresse IP &amp; Localisation</span>
                  <span className="font-mono text-label-md text-amud-on-surface">
                    {selected.ip} ({selected.localisation})
                  </span>
                </div>
              </div>
            </div>
          </div>
        ) : null}
      </Drawer>
    </div>
  );
}
