'use client';

import { useMemo, useState } from 'react';

type Role = 'Candidat' | 'Recruteur' | 'Commercial' | 'Administrateur';
type Statut = 'Actif' | 'Bloqué' | 'Inactif';

type Utilisateur = {
  id: string;
  nom: string;
  email: string;
  role: Role;
  ville: string;
  statut: Statut;
  dernierAcces: string;
  creeLe: string;
};

const ROLES: Role[] = ['Candidat', 'Recruteur', 'Commercial', 'Administrateur'];

const SEED: Utilisateur[] = [
  { id: '1', nom: 'Sophie Martin', email: 's.martin@email.com', role: 'Recruteur', ville: 'Casablanca', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '12/10/2023' },
  { id: '2', nom: 'Lucas Renard', email: 'l.renard@email.com', role: 'Commercial', ville: 'Paris', statut: 'Actif', dernierAcces: 'Hier', creeLe: '05/09/2023' },
  { id: '3', nom: 'Emma Leroy', email: 'e.leroy@email.com', role: 'Administrateur', ville: 'Lyon', statut: 'Bloqué', dernierAcces: '--', creeLe: '10/08/2023' },
  { id: '4', nom: 'Youssef Amrani', email: 'y.amrani@email.com', role: 'Candidat', ville: 'Casablanca', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '02/02/2024' },
  { id: '5', nom: 'Nadia Mansouri', email: 'n.mansouri@email.com', role: 'Candidat', ville: 'Marrakech', statut: 'Actif', dernierAcces: 'Il y a 3 jours', creeLe: '14/01/2024' },
  { id: '6', nom: 'Marie Lambert', email: 'marie.lambert@amudskills.com', role: 'Commercial', ville: 'Lyon', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '05/09/2023' },
  { id: '7', nom: 'Karim Bennani', email: 'k.bennani@email.com', role: 'Recruteur', ville: 'Berlin', statut: 'Inactif', dernierAcces: 'Il y a 2 semaines', creeLe: '20/06/2023' },
  { id: '8', nom: 'Jean Dupont', email: 'jean.dupont@amudskills.com', role: 'Commercial', ville: 'Paris', statut: 'Actif', dernierAcces: "Aujourd'hui", creeLe: '12/03/2023' },
];

const STATUT_DOT: Record<Statut, string> = {
  Actif: 'bg-amud-primary-container',
  Bloqué: 'bg-amud-error',
  Inactif: 'bg-amud-outline',
};
const STATUT_TEXT: Record<Statut, string> = {
  Actif: 'text-amud-primary-container',
  Bloqué: 'text-amud-error',
  Inactif: 'text-amud-outline',
};

export default function AmudAdminUtilisateursPage() {
  const [users, setUsers] = useState(SEED);
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('Rôle');
  const [statutFilter, setStatutFilter] = useState('Statut');
  const [selected, setSelected] = useState<string[]>([]);
  const [openMenu, setOpenMenu] = useState<string | null>(null);

  const filtered = useMemo(() => {
    return users.filter((u) => {
      const q = search.trim().toLowerCase();
      const matchesSearch = !q || u.nom.toLowerCase().includes(q) || u.email.toLowerCase().includes(q);
      const matchesRole = roleFilter === 'Rôle' || u.role === roleFilter;
      const matchesStatut = statutFilter === 'Statut' || u.statut === statutFilter;
      return matchesSearch && matchesRole && matchesStatut;
    });
  }, [users, search, roleFilter, statutFilter]);

  const allSelected = filtered.length > 0 && filtered.every((u) => selected.includes(u.id));

  function toggleAll() {
    setSelected(allSelected ? [] : filtered.map((u) => u.id));
  }
  function toggleOne(id: string) {
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }
  function bulkSetStatut(statut: Statut) {
    setUsers((prev) => prev.map((u) => (selected.includes(u.id) ? { ...u, statut } : u)));
  }
  function toggleStatut(id: string) {
    setUsers((prev) => prev.map((u) => (u.id === id ? { ...u, statut: u.statut === 'Actif' ? 'Bloqué' : 'Actif' } : u)));
  }
  function cycleRole(id: string) {
    setUsers((prev) =>
      prev.map((u) => (u.id === id ? { ...u, role: ROLES[(ROLES.indexOf(u.role) + 1) % ROLES.length] } : u)),
    );
  }

  const counts = {
    total: users.length,
    candidats: users.filter((u) => u.role === 'Candidat').length,
    recruteurs: users.filter((u) => u.role === 'Recruteur').length,
    commerciaux: users.filter((u) => u.role === 'Commercial').length,
    admins: users.filter((u) => u.role === 'Administrateur').length,
    actifs: users.filter((u) => u.statut === 'Actif').length,
    bloques: users.filter((u) => u.statut === 'Bloqué').length,
  };

  return (
    <div className="mx-auto w-full max-w-7xl">
      <div className="mb-xl flex items-end justify-between gap-4 border-l-4 border-amud-primary pl-4">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des utilisateurs</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Gérez les comptes, les rôles et les accès de la plateforme.</p>
        </div>
      </div>

      <div className="mb-xl grid grid-cols-2 gap-4 md:grid-cols-4 lg:grid-cols-7">
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm lg:col-span-2">
          <div className="mb-2 flex items-start justify-between">
            <span className="text-label-sm text-amud-on-surface-variant">Total utilisateurs</span>
            <span className="material-symbols-outlined text-amud-primary">group</span>
          </div>
          <span className="text-display-lg text-amud-on-surface">{counts.total}</span>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
          <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Candidats</span>
          <span className="text-headline-md text-amud-on-surface">{counts.candidats}</span>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
          <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Recruteurs</span>
          <span className="text-headline-md text-amud-on-surface">{counts.recruteurs}</span>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
          <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Commerciaux</span>
          <span className="text-headline-md text-amud-on-surface">{counts.commerciaux}</span>
        </div>
        <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-4 shadow-sm">
          <span className="mb-1 block text-label-sm text-amud-on-surface-variant">Admins</span>
          <span className="text-headline-md text-amud-on-surface">{counts.admins}</span>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant bg-amud-surface-container-low p-4 shadow-sm">
          <span className="flex items-center gap-1 text-label-sm text-amud-primary-container">
            <span className="h-2 w-2 rounded-full bg-amud-primary-container" />
            Actifs
          </span>
          <span className="text-title-lg text-amud-on-surface">{counts.actifs}</span>
        </div>
        <div className="flex flex-col justify-between rounded-xl border border-amud-error-container bg-amud-error-container p-4 shadow-sm">
          <span className="flex items-center gap-1 text-label-sm text-amud-on-error-container">
            <span className="h-2 w-2 rounded-full bg-amud-error" />
            Bloqués
          </span>
          <span className="text-title-lg text-amud-on-error-container">{counts.bloques}</span>
        </div>
      </div>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-6 shadow-sm">
        <div className="mb-4 flex flex-col gap-4 md:flex-row">
          <div className="relative flex-1">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-3 pl-10 pr-4 text-body-md outline-none transition-shadow focus:border-amud-primary focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
              placeholder="Rechercher par nom ou email…"
              type="text"
            />
          </div>
        </div>
        <div className="flex flex-wrap gap-3">
          <select
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 pr-8 text-label-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option>Rôle</option>
            {ROLES.map((r) => (
              <option key={r}>{r}</option>
            ))}
          </select>
          <select
            value={statutFilter}
            onChange={(e) => setStatutFilter(e.target.value)}
            className="cursor-pointer appearance-none rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 pr-8 text-label-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option>Statut</option>
            <option>Actif</option>
            <option>Bloqué</option>
            <option>Inactif</option>
          </select>
        </div>
      </div>

      <div className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-6 py-4">
          <div className="flex items-center gap-3">
            <input type="checkbox" checked={allSelected} onChange={toggleAll} className="h-5 w-5 cursor-pointer rounded border-amud-outline-variant text-amud-primary focus:ring-amud-primary" />
            <span className="text-label-md text-amud-on-surface-variant">{selected.length > 0 ? `${selected.length} sélectionné(s)` : 'Sélectionner tout'}</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              disabled={!selected.length}
              onClick={() => bulkSetStatut('Actif')}
              className="rounded-md border border-amud-outline-variant bg-amud-surface px-3 py-1.5 text-label-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Activer
            </button>
            <button
              disabled={!selected.length}
              onClick={() => bulkSetStatut('Bloqué')}
              className="rounded-md border border-amud-outline-variant bg-amud-surface px-3 py-1.5 text-label-sm text-amud-on-surface transition-colors hover:bg-amud-surface-container disabled:cursor-not-allowed disabled:opacity-40"
            >
              Désactiver
            </button>
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface text-label-sm text-amud-on-surface-variant">
                <th className="w-12 px-6 py-3 font-medium" />
                <th className="px-6 py-3 font-medium">Utilisateur</th>
                <th className="px-6 py-3 font-medium">Rôle</th>
                <th className="px-6 py-3 font-medium">Ville</th>
                <th className="px-6 py-3 font-medium">Statut</th>
                <th className="px-6 py-3 font-medium">Dernier accès</th>
                <th className="px-6 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody className="text-body-md text-amud-on-surface">
              {filtered.map((u) => (
                <tr key={u.id} className="border-b border-amud-outline-variant transition-colors last:border-0 hover:bg-amud-surface-container-low">
                  <td className="px-6 py-4">
                    <input
                      type="checkbox"
                      checked={selected.includes(u.id)}
                      onChange={() => toggleOne(u.id)}
                      className="h-5 w-5 cursor-pointer rounded border-amud-outline-variant text-amud-primary focus:ring-amud-primary"
                    />
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-full border border-amud-outline-variant bg-amud-surface-container font-bold text-amud-primary">
                        {u.nom
                          .split(' ')
                          .map((p) => p[0])
                          .join('')}
                      </div>
                      <div>
                        <div className="text-[16px] leading-tight text-amud-on-surface">{u.nom}</div>
                        <div className="text-label-sm text-amud-on-surface-variant">{u.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button
                      onClick={() => cycleRole(u.id)}
                      title="Cliquer pour changer le rôle"
                      className="inline-flex items-center rounded-full border border-amud-outline-variant bg-amud-surface-container-highest px-2.5 py-0.5 text-xs font-medium text-amud-on-surface-variant transition-colors hover:border-amud-primary hover:text-amud-primary"
                    >
                      {u.role}
                    </button>
                  </td>
                  <td className="px-6 py-4 text-amud-on-surface-variant">{u.ville}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center gap-1.5 text-label-sm font-medium ${STATUT_TEXT[u.statut]}`}>
                      <span className={`h-2 w-2 rounded-full ${STATUT_DOT[u.statut]}`} />
                      {u.statut}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-label-sm text-amud-on-surface-variant">{u.dernierAcces}</td>
                  <td className="relative px-6 py-4 text-right">
                    <button
                      onClick={() => setOpenMenu(openMenu === u.id ? null : u.id)}
                      className="rounded-md p-1 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container hover:text-amud-primary"
                    >
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === u.id ? (
                      <div className="absolute right-6 top-12 z-10 w-44 rounded-lg border border-amud-outline-variant bg-amud-surface-container-lowest py-1 text-left shadow-lg">
                        <button
                          onClick={() => {
                            toggleStatut(u.id);
                            setOpenMenu(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                        >
                          {u.statut === 'Actif' ? 'Désactiver' : 'Activer'}
                        </button>
                        <button
                          onClick={() => {
                            cycleRole(u.id);
                            setOpenMenu(null);
                          }}
                          className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low"
                        >
                          Changer de rôle
                        </button>
                      </div>
                    ) : null}
                  </td>
                </tr>
              ))}
              {filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                    Aucun utilisateur ne correspond à ces filtres.
                  </td>
                </tr>
              ) : null}
            </tbody>
          </table>
        </div>
        <div className="flex items-center justify-between border-t border-amud-outline-variant bg-amud-surface-container-lowest px-6 py-4">
          <span className="text-label-sm text-amud-on-surface-variant">
            Affichage de {filtered.length} sur {users.length} utilisateurs
          </span>
        </div>
      </div>
    </div>
  );
}
