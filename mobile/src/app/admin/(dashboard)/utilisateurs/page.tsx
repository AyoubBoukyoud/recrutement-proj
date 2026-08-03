'use client';

// Interface 24 — Gestion des utilisateurs.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { Search } from 'lucide-react';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';

const STATUS_CLASS: Record<string, string> = {
  actif: 'bg-green-100 text-green-700',
  suspendu: 'bg-red-100 text-red-600',
  en_attente: 'bg-amber-100 text-amber-700',
};

const STATUS_LABEL: Record<string, string> = {
  actif: 'Actif',
  suspendu: 'Suspendu',
  en_attente: 'En attente',
};

export default function AdminUsersPage() {
  const [query, setQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'candidate' | 'employer'>('all');

  const users = useMemo(() => {
    return MOCK_ADMIN_USERS.filter((u) => {
      const matchesQuery = query ? u.name.toLowerCase().includes(query.toLowerCase()) : true;
      const matchesRole = roleFilter === 'all' ? true : u.role === roleFilter;
      return matchesQuery && matchesRole;
    });
  }, [query, roleFilter]);

  return (
    <div className="mx-auto max-w-5xl">
      <h1 className="text-2xl font-bold text-navy-900">Utilisateurs</h1>
      <p className="mt-1 text-sm text-onSurface-variant">{MOCK_ADMIN_USERS.length} comptes enregistrés.</p>

      <div className="mt-4 flex flex-col gap-2 sm:flex-row">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un utilisateur…"
            className="w-full rounded-xl border border-gray-200 bg-white py-2.5 pl-9 pr-3 text-sm outline-none focus:border-navy-900"
          />
        </div>
        <div className="flex gap-2">
          {(['all', 'candidate', 'employer'] as const).map((role) => (
            <button
              key={role}
              type="button"
              onClick={() => setRoleFilter(role)}
              className={`rounded-xl border-2 px-3 py-2 text-xs font-semibold ${
                roleFilter === role ? 'border-navy-900 bg-blue-50 text-navy-900' : 'border-gray-100 text-onSurface-variant'
              }`}
            >
              {role === 'all' ? 'Tous' : role === 'candidate' ? 'Candidats' : 'Employeurs'}
            </button>
          ))}
        </div>
      </div>

      {/* Tableau desktop / cartes mobile */}
      <div className="mt-5 hidden overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft md:block">
        <table className="w-full text-left text-sm">
          <thead className="bg-surface-container text-xs font-semibold text-onSurface-variant">
            <tr>
              <th className="px-4 py-3">Nom</th>
              <th className="px-4 py-3">Rôle</th>
              <th className="px-4 py-3">E-mail</th>
              <th className="px-4 py-3">Statut</th>
              <th className="px-4 py-3">Inscrit le</th>
              <th className="px-4 py-3" />
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id} className="border-t border-gray-50">
                <td className="px-4 py-3 font-semibold text-navy-900">{user.name}</td>
                <td className="px-4 py-3 capitalize text-onSurface-variant">{user.role}</td>
                <td className="px-4 py-3 text-onSurface-variant">{user.email}</td>
                <td className="px-4 py-3">
                  <span className={`rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[user.status]}`}>
                    {STATUS_LABEL[user.status]}
                  </span>
                </td>
                <td className="px-4 py-3 text-onSurface-variant">{user.createdAt}</td>
                <td className="px-4 py-3 text-right">
                  {user.status === 'en_attente' && (
                    <Link href="/admin/validation" className="text-xs font-bold text-amber-600">Valider →</Link>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-5 space-y-2.5 md:hidden">
        {users.map((user) => (
          <div key={user.id} className="rounded-xl border border-gray-100 bg-white p-4 shadow-soft">
            <div className="flex items-center justify-between">
              <span className="text-sm font-bold text-navy-900">{user.name}</span>
              <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_CLASS[user.status]}`}>
                {STATUS_LABEL[user.status]}
              </span>
            </div>
            <p className="mt-1 text-xs capitalize text-onSurface-variant">{user.role} · {user.email}</p>
            {user.status === 'en_attente' && (
              <Link href="/admin/validation" className="mt-2 inline-block text-xs font-bold text-amber-600">
                Aller à la validation →
              </Link>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
