'use client';

// Interface 26 — Gestion des réclamations & tickets.

import { useMemo, useState } from 'react';
import { MOCK_RECLAMATIONS } from '@/lib/mockData';
import type { ReclamationEntry } from '@/lib/types';

const STATUS_LABEL: Record<ReclamationEntry['status'], string> = {
  ouverte: 'Ouverte',
  en_cours: 'En cours',
  resolue: 'Résolue',
};

const STATUS_CLASS: Record<ReclamationEntry['status'], string> = {
  ouverte: 'bg-secondary-light text-onSecondary-container',
  en_cours: 'bg-gold-light text-gold-dark',
  resolue: 'bg-primary-light text-onPrimary-container',
};

export default function AdminReclamationsPage() {
  const [tickets, setTickets] = useState<ReclamationEntry[]>(MOCK_RECLAMATIONS);
  const [filter, setFilter] = useState<'all' | ReclamationEntry['status']>('all');
  const [query, setQuery] = useState('');
  const [activeId, setActiveId] = useState<string | null>(null);

  const counts = useMemo(
    () => ({
      ouverte: tickets.filter((t) => t.status === 'ouverte').length,
      en_cours: tickets.filter((t) => t.status === 'en_cours').length,
      resolue: tickets.filter((t) => t.status === 'resolue').length,
    }),
    [tickets]
  );

  const setStatus = (id: string, status: ReclamationEntry['status']) => {
    setTickets((prev) => prev.map((t) => (t.id === id ? { ...t, status } : t)));
  };

  const filtered = tickets.filter((t) => {
    const matchesStatus = filter === 'all' ? true : t.status === filter;
    const matchesQuery = query ? `${t.subject} ${t.authorName}`.toLowerCase().includes(query.toLowerCase()) : true;
    return matchesStatus && matchesQuery;
  });

  const activeTicket = tickets.find((t) => t.id === activeId) ?? null;

  return (
    <div className="mx-auto max-w-4xl">
      <header className="flex h-16 items-center gap-3 border-b border-outline-variant bg-surface px-4 md:px-8">
        <h1 className="text-xl font-bold text-primary">Réclamations</h1>
        <span className="rounded-full bg-primary-light px-2 py-0.5 text-xs font-bold text-onPrimary-container">{tickets.length}</span>
      </header>

      <div className="space-y-4 p-4 md:p-8">
        <div className="flex gap-3 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setFilter('ouverte')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-bold shadow-sm transition-colors ${
              filter === 'ouverte' ? 'border-primary bg-primary-light text-onPrimary-container' : 'border-outline-variant text-onSurface-variant'
            }`}
          >
            Ouvertes ({counts.ouverte})
          </button>
          <button
            type="button"
            onClick={() => setFilter('en_cours')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'en_cours' ? 'border-primary bg-primary-light text-onPrimary-container' : 'border-outline-variant text-onSurface-variant'
            }`}
          >
            En cours ({counts.en_cours})
          </button>
          <button
            type="button"
            onClick={() => setFilter('resolue')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'resolue' ? 'border-primary bg-primary-light text-onPrimary-container' : 'border-outline-variant text-onSurface-variant'
            }`}
          >
            Résolues ({counts.resolue})
          </button>
          <button
            type="button"
            onClick={() => setFilter('all')}
            className={`shrink-0 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
              filter === 'all' ? 'border-primary bg-primary-light text-onPrimary-container' : 'border-outline-variant text-onSurface-variant'
            }`}
          >
            Tous
          </button>
        </div>

        <div className="flex gap-2">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-onSurface-variant" style={{ fontSize: 20 }}>
              search
            </span>
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Rechercher un ticket…"
              className="w-full rounded-xl border border-outline-variant bg-surface-low py-3 pl-10 pr-4 text-sm outline-none transition-all focus:ring-2 focus:ring-primary"
            />
          </div>
        </div>

        <div className="space-y-3">
          {filtered.map((ticket) => (
            <button
              key={ticket.id}
              type="button"
              onClick={() => setActiveId(ticket.id)}
              className="flex w-full flex-col gap-3 rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-lowest p-4 text-left shadow-sm transition-transform active:scale-[0.98]"
            >
              <div>
                <h3 className="text-base font-semibold text-onSurface">{ticket.subject}</h3>
                <div className="mt-1 flex items-center gap-2">
                  <span className="material-symbols-outlined text-primary" style={{ fontSize: 14 }}>person</span>
                  <p className="text-sm text-onSurface-variant">
                    {ticket.authorName} <span className="opacity-60">· {ticket.authorRole === 'candidate' ? 'Candidat' : 'Employeur'}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center justify-between border-t border-outline-variant/30 pt-2">
                <span className="rounded-full bg-gold-light px-3 py-1 text-sm text-gold-dark">{ticket.category}</span>
                <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[ticket.status]}`}>
                  {STATUS_LABEL[ticket.status]}
                </span>
              </div>
            </button>
          ))}
          {filtered.length === 0 && (
            <p className="rounded-xl bg-surface-container p-6 text-center text-sm text-onSurface-variant">Aucun ticket trouvé.</p>
          )}
        </div>
      </div>

      {activeTicket && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/40" onClick={() => setActiveId(null)} />
          <div className="relative flex h-full w-full max-w-md flex-col bg-surface shadow-2xl">
            <div className="flex items-center justify-between border-b border-outline-variant bg-surface-lowest p-4">
              <button type="button" onClick={() => setActiveId(null)} className="-ml-2 p-2 text-onSurface">
                <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
              </button>
              <div className="text-center">
                <p className="text-xs font-bold text-onSurface-variant">#{activeTicket.id}</p>
                <h2 className="text-lg font-bold text-primary">Détails Ticket</h2>
              </div>
              <div className="w-10" />
            </div>

            <div className="flex-grow space-y-6 overflow-y-auto bg-surface-low/30 p-4">
              <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-4 shadow-sm">
                <h3 className="mb-4 text-lg font-bold text-onSurface">{activeTicket.subject}</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-onSurface-variant opacity-60">Auteur</p>
                    <p className="font-bold">{activeTicket.authorName}</p>
                  </div>
                  <div>
                    <p className="text-onSurface-variant opacity-60">Catégorie</p>
                    <p className="font-bold">{activeTicket.category}</p>
                  </div>
                </div>
              </div>

              <div className="rounded-2xl border border-outline-variant bg-surface-lowest p-4 shadow-sm">
                <p className="text-sm leading-relaxed text-onSurface">{activeTicket.message}</p>
              </div>

              <div className="space-y-3 rounded-2xl border border-primary/10 bg-surface-container p-4">
                <p className="text-xs font-bold uppercase tracking-wider text-primary">Paramètres du ticket</p>
                <div className="space-y-1">
                  <label className="px-1 text-xs text-onSurface-variant">Statut</label>
                  <select
                    value={activeTicket.status}
                    onChange={(e) => setStatus(activeTicket.id, e.target.value as ReclamationEntry['status'])}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2 text-sm focus:border-primary focus:ring-primary"
                  >
                    <option value="ouverte">Ouvert</option>
                    <option value="en_cours">En cours</option>
                    <option value="resolue">Résolu</option>
                  </select>
                </div>
              </div>
            </div>

            <div className="border-t border-outline-variant bg-surface p-4">
              <div className="flex items-end gap-2">
                <textarea
                  rows={1}
                  placeholder="Tapez votre réponse…"
                  className="flex-grow resize-none rounded-2xl border border-outline-variant bg-surface-low px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-primary"
                />
                <button type="button" className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary text-onPrimary shadow-lg transition-transform active:scale-90">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
