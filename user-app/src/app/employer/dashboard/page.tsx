// Interface 18 — Tableau de bord employeur.

import Link from 'next/link';
import { KpiCard } from '@/components/shared/KpiCard';
import { CandidateCard } from '@/components/shared/CandidateCard';
import { MOCK_CANDIDATES } from '@/lib/mockData';

const STATUS_LABEL: Record<(typeof MOCK_CANDIDATES)[number]['status'], string> = {
  nouveau: 'Nouveau',
  contacte: 'Contacté',
  entretien: 'Entretien',
  valide: 'Offre',
};

const STATUS_CLASS: Record<(typeof MOCK_CANDIDATES)[number]['status'], string> = {
  nouveau: 'bg-primary-light text-onPrimary-container',
  contacte: 'bg-surface-high text-onSurface-variant',
  entretien: 'bg-gold text-onGold',
  valide: 'bg-primary text-onPrimary',
};

export default function EmployerDashboardPage() {
  const recentCandidates = MOCK_CANDIDATES.slice(0, 4);

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-6 md:p-8">
      <section>
        <h1 className="text-3xl font-bold text-onSurface">Employer Dashboard</h1>
        <p className="text-onSurface-variant">Voici ce qui se passe dans votre pipeline de recrutement aujourd&apos;hui.</p>
      </section>

      <section className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <KpiCard label="Nouveaux candidats" value={48} icon="person_add" trend={{ value: 12, direction: 'up' }} />
        <KpiCard label="Intérêts mutuels" value={9} icon="handshake" trend={{ value: 5, direction: 'up' }} />
        <KpiCard label="Conversations" value={6} icon="mail" />
        <KpiCard label="Taux de réponse" value="82%" icon="analytics" trend={{ value: 3, direction: 'down' }} />
      </section>

      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h3 className="flex items-center gap-2 text-lg font-bold text-onSurface">
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>flash_on</span>
            Derniers candidats
          </h3>
          <Link href="/employer/recherche" className="text-sm font-bold text-primary hover:underline">Voir tout le vivier</Link>
        </div>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {recentCandidates.map((candidate) => (
            <CandidateCard key={candidate.id} candidate={candidate} href={`/employer/candidat/${candidate.id}`} />
          ))}
        </div>
      </section>

      <section className="grid gap-4 md:grid-cols-3">
        <Link href="/employer/recherche" className="rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-soft transition-colors hover:border-primary">
          <div className="text-sm font-bold text-primary">Rechercher des candidats</div>
          <p className="mt-1 text-xs text-onSurface-variant">Filtrez par compétences, langue et secteur.</p>
        </Link>
        <Link href="/employer/matchings" className="rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-soft transition-colors hover:border-primary">
          <div className="text-sm font-bold text-primary">Voir mes matchings</div>
          <p className="mt-1 text-xs text-onSurface-variant">Mode swipe ou pipeline kanban.</p>
        </Link>
        <Link href="/employer/messagerie" className="rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-soft transition-colors hover:border-primary">
          <div className="text-sm font-bold text-primary">Messagerie</div>
          <p className="mt-1 text-xs text-onSurface-variant">6 conversations actives.</p>
        </Link>
      </section>

      <section className="overflow-hidden rounded-2xl border border-outline-variant bg-surface-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-low px-6 py-4">
          <h3 className="text-lg font-bold text-onSurface">Matchings récents</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="border-b border-outline-variant text-[12px] font-bold uppercase tracking-widest text-onSurface-variant">
                <th className="px-6 py-3">Candidat</th>
                <th className="px-6 py-3">Poste</th>
                <th className="px-6 py-3">Statut</th>
                <th className="px-6 py-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {MOCK_CANDIDATES.map((c) => (
                <tr key={c.id} className="transition-colors hover:bg-surface-low">
                  <td className="px-6 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary-light text-[10px] font-black text-primary">
                        {c.avatarInitials}
                      </div>
                      <span className="font-bold text-onSurface">{c.name}</span>
                    </div>
                  </td>
                  <td className="px-6 py-3 text-sm text-onSurface-variant">{c.role}</td>
                  <td className="px-6 py-3">
                    <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold ${STATUS_CLASS[c.status]}`}>
                      {STATUS_LABEL[c.status]}
                    </span>
                  </td>
                  <td className="px-6 py-3 text-right">
                    <Link href={`/employer/candidat/${c.id}`} className="text-xs font-bold text-primary hover:underline">
                      Voir détails
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
