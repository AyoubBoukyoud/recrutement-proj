'use client';

import { useState } from 'react';

type ActionKey = 'voir' | 'creer' | 'modifier' | 'supprimer' | 'valider' | 'export';
type ModuleKey = 'dashboard' | 'candidats' | 'offres';

const ACTIONS: { key: ActionKey; label: string }[] = [
  { key: 'voir', label: 'Voir' },
  { key: 'creer', label: 'Créer' },
  { key: 'modifier', label: 'Modif.' },
  { key: 'supprimer', label: 'Suppr.' },
  { key: 'valider', label: 'Valider' },
  { key: 'export', label: 'Export' },
];

const MODULES: { key: ModuleKey; label: string; icon: string; na: ActionKey[] }[] = [
  { key: 'dashboard', label: 'Dashboard', icon: 'dashboard', na: ['valider'] },
  { key: 'candidats', label: 'Candidats', icon: 'person_search', na: [] },
  { key: 'offres', label: 'Offres', icon: 'work', na: ['export'] },
];

type Matrix = Record<ModuleKey, Record<ActionKey, boolean>>;

const ROLES = [
  { id: 'super-admin', nom: 'Super Administrateur', desc: 'Accès total', users: 2 },
  { id: 'admin', nom: 'Administrateur', desc: 'Gestion globale', users: 5 },
  { id: 'commercial', nom: 'Commercial', desc: 'Gestion des ventes', users: 45 },
  { id: 'recruteur', nom: 'Recruteur', desc: 'Gestion talents', users: 12 },
] as const;

function defaultMatrix(roleId: string): Matrix {
  const all = (v: boolean): Record<ActionKey, boolean> => ({ voir: v, creer: v, modifier: v, supprimer: v, valider: v, export: v });
  switch (roleId) {
    case 'super-admin':
      return { dashboard: all(true), candidats: all(true), offres: all(true) };
    case 'admin':
      return {
        dashboard: { voir: true, creer: true, modifier: true, supprimer: false, valider: true, export: true },
        candidats: { voir: true, creer: true, modifier: true, supprimer: true, valider: true, export: true },
        offres: { voir: true, creer: true, modifier: true, supprimer: false, valider: true, export: true },
      };
    case 'recruteur':
      return {
        dashboard: { voir: true, creer: false, modifier: false, supprimer: false, valider: false, export: false },
        candidats: { voir: true, creer: true, modifier: true, supprimer: false, valider: false, export: false },
        offres: { voir: true, creer: true, modifier: false, supprimer: false, valider: false, export: false },
      };
    default:
      // Commercial — reprend les valeurs de la maquette source.
      return {
        dashboard: { voir: true, creer: false, modifier: false, supprimer: false, valider: false, export: false },
        candidats: { voir: true, creer: true, modifier: true, supprimer: false, valider: false, export: false },
        offres: { voir: true, creer: false, modifier: false, supprimer: false, valider: false, export: false },
      };
  }
}

export default function AmudAdminRolesPermissionsPage() {
  const [roleId, setRoleId] = useState<string>('commercial');
  const [visibilite, setVisibilite] = useState("Enregistrements de l'équipe");
  const [zone, setZone] = useState('Aucune restriction');
  const [matrices, setMatrices] = useState<Record<string, Matrix>>(() =>
    Object.fromEntries(ROLES.map((r) => [r.id, defaultMatrix(r.id)])),
  );
  const [notice, setNotice] = useState<string | null>(null);

  const role = ROLES.find((r) => r.id === roleId)!;
  const matrix = matrices[roleId];

  function setCell(mod: ModuleKey, action: ActionKey, value: boolean) {
    setMatrices((prev) => ({ ...prev, [roleId]: { ...prev[roleId], [mod]: { ...prev[roleId][mod], [action]: value } } }));
  }

  function resetRole() {
    setMatrices((prev) => ({ ...prev, [roleId]: defaultMatrix(roleId) }));
    setNotice(`Permissions de « ${role.nom} » réinitialisées.`);
  }

  return (
    <div className="mx-auto flex w-full max-w-[1200px] flex-col gap-xl">
      {notice ? (
        <div className="flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-primary-fixed p-md text-body-md text-amud-on-primary-fixed">
          <span className="material-symbols-outlined">check_circle</span>
          {notice}
        </div>
      ) : null}

      <div className="flex flex-col justify-between gap-md border-b border-amud-outline-variant pb-md md:flex-row md:items-end">
        <div>
          <h2 className="text-headline-lg font-bold text-amud-primary">Rôles &amp; permissions</h2>
          <p className="mt-xs text-body-lg text-amud-on-surface-variant">Contrôlez précisément les accès et les actions disponibles pour chaque rôle.</p>
        </div>
        <div className="flex gap-sm">
          <button onClick={resetRole} className="rounded-lg border border-amud-outline px-md py-sm text-label-md text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container">
            Réinitialiser
          </button>
          <button
            onClick={() => setNotice('La création de rôles personnalisés arrive bientôt.')}
            className="rounded-lg bg-amud-primary px-md py-sm text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
          >
            Créer un rôle
          </button>
          <button
            onClick={() => setNotice(`Permissions de « ${role.nom} » enregistrées.`)}
            className="rounded-lg bg-amud-primary px-md py-sm text-label-md text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
          >
            Enregistrer
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-gutter lg:grid-cols-4">
        <div className="flex flex-col gap-md lg:col-span-1">
          <h3 className="border-l-4 border-amud-primary pl-sm text-title-lg text-amud-on-surface">Sélectionner un rôle</h3>
          <div className="flex flex-col gap-xs rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-sm shadow-sm">
            {ROLES.map((r) => (
              <button
                key={r.id}
                onClick={() => setRoleId(r.id)}
                className={`flex items-center justify-between rounded-md border p-md text-left transition-colors ${
                  roleId === r.id ? 'border-amud-outline bg-amud-surface-container' : 'border-transparent hover:bg-amud-surface-container-low'
                }`}
              >
                <div>
                  <h4 className={`text-label-md ${roleId === r.id ? 'font-bold text-amud-primary' : 'text-amud-on-surface'}`}>{r.nom}</h4>
                  <p className="text-label-sm text-amud-on-surface-variant">{r.desc}</p>
                </div>
                <span className="rounded-full bg-amud-surface-container-highest px-sm py-xs text-label-sm text-amud-on-surface-variant">{r.users} usr</span>
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-lg lg:col-span-3">
          <div className="rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
            <h3 className="mb-md border-l-4 border-amud-primary pl-sm text-title-lg text-amud-on-surface">Portée &amp; Visibilité ({role.nom})</h3>
            <div className="grid grid-cols-1 gap-md md:grid-cols-2">
              <div>
                <label className="mb-sm block text-label-md text-amud-on-surface-variant">Visibilité des données</label>
                <select
                  value={visibilite}
                  onChange={(e) => setVisibilite(e.target.value)}
                  className="w-full rounded-md border-amud-outline-variant bg-amud-surface-container-lowest p-sm text-body-md text-amud-on-surface shadow-sm focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
                >
                  <option>Enregistrements de l&apos;équipe</option>
                  <option>Propres enregistrements</option>
                  <option>Tous les enregistrements</option>
                </select>
              </div>
              <div>
                <label className="mb-sm block text-label-md text-amud-on-surface-variant">Zone géographique restreinte</label>
                <select
                  value={zone}
                  onChange={(e) => setZone(e.target.value)}
                  className="w-full rounded-md border-amud-outline-variant bg-amud-surface-container-lowest p-sm text-body-md text-amud-on-surface shadow-sm focus:border-amud-primary focus:ring-1 focus:ring-amud-primary"
                >
                  <option>Aucune restriction</option>
                  <option>Région assignée</option>
                  <option>Pays</option>
                </select>
              </div>
            </div>
          </div>

          <div className="overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low p-md">
              <h3 className="border-l-4 border-amud-primary pl-sm text-title-lg text-amud-on-surface">Matrice des permissions</h3>
              <span className="rounded-md bg-amud-surface-container-highest px-sm py-xs text-label-sm text-amud-on-surface-variant">Mode : Édition</span>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full whitespace-nowrap text-left text-body-md">
                <thead className="border-b border-amud-outline-variant bg-amud-surface-container text-label-md text-amud-on-surface-variant">
                  <tr>
                    <th className="p-md font-medium">Module</th>
                    {ACTIONS.map((a) => (
                      <th key={a.key} className="p-md text-center font-medium">
                        {a.label}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-amud-outline-variant">
                  {MODULES.map((m) => (
                    <tr key={m.key} className="transition-colors hover:bg-amud-surface-container-low">
                      <td className="flex items-center gap-sm p-md font-medium text-amud-on-surface">
                        <span className="material-symbols-outlined text-amud-outline">{m.icon}</span>
                        {m.label}
                      </td>
                      {ACTIONS.map((a) => (
                        <td key={a.key} className="p-md text-center">
                          {m.na.includes(a.key) ? (
                            <span className="text-amud-outline-variant">-</span>
                          ) : (
                            <PermSwitch checked={matrix[m.key][a.key]} onChange={(v) => setCell(m.key, a.key, v)} />
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PermSwitch({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <label className="relative inline-block h-5 w-9 cursor-pointer">
      <input type="checkbox" checked={checked} onChange={(e) => onChange(e.target.checked)} className="peer sr-only" />
      <span className="absolute inset-0 rounded-full bg-amud-outline-variant transition-colors duration-300 peer-checked:bg-amud-primary-container" />
      <span className="absolute left-[2px] top-[2px] h-4 w-4 rounded-full bg-white transition-transform duration-300 peer-checked:translate-x-4" />
    </label>
  );
}
