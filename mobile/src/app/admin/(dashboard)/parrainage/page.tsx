'use client';

// Interface 28 — Gestion du programme de parrainage.

import { useMemo, useState } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';
import { MOCK_REFERRALS } from '@/lib/mockData';

const STATUS_LABEL: Record<string, string> = { invite: 'Invité', inscrit: 'Inscrit', recrute: 'Recruté' };
const STATUS_CLASS: Record<string, string> = {
  invite: 'bg-surface-container text-onSurface-variant',
  inscrit: 'bg-primary-light text-onPrimary-container',
  recrute: 'bg-primary text-onPrimary',
};

export default function AdminReferralPage() {
  const [qrAgent, setQrAgent] = useState<string | null>(null);
  const recruited = MOCK_REFERRALS.filter((r) => r.status === 'recrute').length;

  const agents = useMemo(() => {
    const bySponsor = new Map<string, number>();
    MOCK_REFERRALS.forEach((r) => bySponsor.set(r.sponsorName, (bySponsor.get(r.sponsorName) ?? 0) + 1));
    const counts = Array.from(bySponsor.values());
    const maxCount = Math.max(...counts);
    return Array.from(bySponsor.entries()).map(([name, count], i) => ({
      name,
      code: `AG-${100 + i}`,
      referrals: count,
      isTop: count === maxCount,
    }));
  }, []);

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6 md:p-8">
      <section>
        <h2 className="text-2xl font-bold text-primary">Gestion Parrainage</h2>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-3">
        <div className="flex flex-col justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium text-onSurface-variant">Total dû ce mois-ci</p>
            <h3 className="mt-1 text-4xl font-bold text-primary">450 <span className="text-lg">MAD</span></h3>
          </div>
          <div className="mt-4 flex items-center gap-2 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>trending_up</span>
            <span className="text-xs">+12% par rapport au mois dernier</span>
          </div>
        </div>
        <div className="flex flex-col justify-between rounded-xl border-l-4 border-primary bg-surface-lowest p-6 shadow-sm">
          <div>
            <p className="text-sm font-medium text-onSurface-variant">Agents actifs</p>
            <h3 className="mt-1 text-3xl font-bold text-onSurface">{agents.length}</h3>
          </div>
          <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-container">
            <div className="h-full bg-primary" style={{ width: '75%' }} />
          </div>
          <p className="mt-1 text-xs text-onSurface-variant">75% de l&apos;objectif mensuel</p>
        </div>
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm">
          <div className="mb-4 flex items-center justify-between">
            <p className="text-sm font-medium text-onSurface-variant">Paliers Commissions</p>
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>info</span>
          </div>
          <ul className="space-y-2">
            <li className="flex items-center justify-between rounded-lg bg-surface-low p-2.5">
              <span className="text-sm">Inscription</span>
              <span className="text-sm font-bold text-primary">50 MAD</span>
            </li>
            <li className="flex items-center justify-between rounded-lg bg-surface-low p-2.5">
              <span className="text-sm">Profil Complété</span>
              <span className="text-sm font-bold text-primary">100 MAD</span>
            </li>
          </ul>
        </div>
      </section>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-xl font-bold text-onSurface">Agents Commerciaux</h3>
          <button type="button" className="flex items-center gap-1.5 rounded-lg bg-primary px-4 py-2 text-sm font-semibold text-onPrimary shadow-sm transition-all hover:opacity-90 active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>add</span>
            Ajouter un agent
          </button>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {agents.map((agent) => (
            <div key={agent.code} className="rounded-xl border border-outline-variant bg-surface-lowest p-5 shadow-sm transition-shadow hover:shadow-md">
              <div className="mb-3 flex items-start justify-between">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary-light font-bold text-onPrimary-container">
                  {agent.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                </div>
                {agent.isTop && (
                  <span className="rounded bg-gold-light px-1.5 py-0.5 text-[10px] font-bold uppercase text-gold-dark">Top Agent</span>
                )}
              </div>
              <h4 className="text-base font-bold text-onSurface">{agent.name}</h4>
              <p className="font-mono text-xs text-onSurface-variant">{agent.code}</p>
              <div className="mt-4 flex items-center justify-between border-t border-outline-variant pt-3">
                <div>
                  <p className="text-[10px] uppercase text-onSurface-variant">Filleuls</p>
                  <p className="text-xl font-bold text-primary">{agent.referrals}</p>
                </div>
                <button
                  type="button"
                  onClick={() => setQrAgent(agent.name)}
                  className="flex h-10 w-10 items-center justify-center rounded-full border border-primary text-primary transition-colors hover:bg-primary hover:text-onPrimary"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>qr_code_2</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="space-y-3 rounded-xl border border-outline-variant bg-surface-lowest shadow-sm">
        <div className="flex items-center justify-between border-b border-outline-variant bg-surface-low px-6 py-4">
          <h3 className="text-lg font-bold text-onSurface">Derniers Parrainages</h3>
          <button type="button" className="flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
            Voir tout <span className="material-symbols-outlined" style={{ fontSize: 16 }}>arrow_forward</span>
          </button>
        </div>
        <div className="overflow-x-auto px-2 pb-2">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">
                <th className="px-4 py-2">Filleul</th>
                <th className="px-4 py-2">Agent parrain</th>
                <th className="px-4 py-2">Date</th>
                <th className="px-4 py-2">Statut &amp; commission</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-outline-variant">
              {MOCK_REFERRALS.map((ref) => (
                <tr key={ref.id} className="transition-colors hover:bg-surface-low">
                  <td className="px-4 py-3">
                    <p className="text-sm font-bold text-onSurface">{ref.refereeName}</p>
                  </td>
                  <td className="px-4 py-3 text-sm text-onSurface-variant">{ref.sponsorName}</td>
                  <td className="px-4 py-3 text-sm text-onSurface-variant">{ref.createdAt}</td>
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-0.5">
                      <span className={`inline-block w-fit rounded-full px-2.5 py-1 text-xs font-bold ${STATUS_CLASS[ref.status]}`}>
                        {STATUS_LABEL[ref.status]}
                      </span>
                      <span className="text-xs text-onSurface-variant">{ref.reward}</span>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <div className="hidden grid-cols-2 gap-3 md:grid-cols-3">
        <KpiCard label="Parrainages" value={MOCK_REFERRALS.length} icon="card_giftcard" />
        <KpiCard label="Recrutés via parrainage" value={recruited} trend={{ value: 14, direction: 'up' }} />
        <KpiCard label="Récompenses distribuées" value="450€" />
      </div>

      <button
        type="button"
        onClick={() => setQrAgent(agents[0]?.name ?? null)}
        className="group fixed bottom-6 right-6 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-onPrimary shadow-lg transition-all hover:scale-105 active:scale-95 md:h-16 md:w-16"
      >
        <span className="material-symbols-outlined text-3xl">qr_code_scanner</span>
      </button>

      {qrAgent && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 px-4 backdrop-blur-sm">
          <div className="relative w-full max-w-sm rounded-2xl bg-surface-lowest p-8 shadow-2xl">
            <button
              type="button"
              onClick={() => setQrAgent(null)}
              className="absolute right-4 top-4 text-onSurface-variant hover:text-primary"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 20 }}>close</span>
            </button>
            <div className="text-center">
              <h3 className="mb-4 text-xl font-bold text-primary">QR Code Agent</h3>
              <div className="mb-6 flex justify-center">
                <QRCodeGenerator value={`AMUD-AGENT-${qrAgent}`} size={200} />
              </div>
              <p className="mb-6 text-sm text-onSurface-variant">
                Scannez ce code pour attribuer un nouveau filleul à <strong>{qrAgent}</strong>.
              </p>
              <div className="flex flex-col gap-2.5">
                <button type="button" className="flex w-full items-center justify-center gap-2 rounded-lg bg-primary py-3 font-bold text-onPrimary">
                  <span className="material-symbols-outlined" style={{ fontSize: 18 }}>download</span>
                  Télécharger JPG
                </button>
                <button type="button" className="w-full rounded-lg border border-outline py-3 font-bold text-onSurface">
                  Imprimer Badge
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
