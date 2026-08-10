'use client';

// Interface 27 — Statistiques globales de la plateforme.

import { useState } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { MOCK_ADMIN_USERS, CEFR_LEVELS } from '@/lib/mockData';

const PERIODS = ['7j', '30j', '90j', '12 mois'];

const SECTOR_BREAKDOWN = [
  { label: 'IT', value: 42 },
  { label: 'Santé', value: 26 },
  { label: 'BTP', value: 18 },
  { label: 'Artisanat', value: 9 },
  { label: 'Autre', value: 5 },
];

const GERMAN_LEVEL_DISTRIBUTION: Record<(typeof CEFR_LEVELS)[number], number> = {
  A1: 20, A2: 45, B1: 85, B2: 60, C1: 15, C2: 5,
};

const TOP_EMPLOYERS = [
  { name: 'TechGmbH Munich', sector: 'IT', hires: 14 },
  { name: 'Helios Kliniken', sector: 'Santé', hires: 9 },
  { name: 'Nordbau Hamburg', sector: 'BTP', hires: 7 },
];

const DEMANDED_SECTORS = [
  { label: 'Développement logiciel', icon: 'code', openings: 38 },
  { label: 'Soins infirmiers', icon: 'medical_services', openings: 26 },
  { label: "Gestion d'entrepôt", icon: 'local_shipping', openings: 19 },
];

export default function AdminStatsPage() {
  const [period, setPeriod] = useState('7j');
  const candidates = MOCK_ADMIN_USERS.filter((u) => u.role === 'candidate').length;
  const employers = MOCK_ADMIN_USERS.filter((u) => u.role === 'employer').length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6 md:p-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">Statistiques</h1>
          <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span>
            Filtres
          </button>
        </div>
        <div className="flex gap-2 overflow-x-auto py-1">
          {PERIODS.map((p) => (
            <button
              key={p}
              type="button"
              onClick={() => setPeriod(p)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-sm font-semibold shadow-sm transition-colors ${
                period === p ? 'bg-primary-light text-onPrimary-container' : 'bg-surface-high text-onSurface-variant hover:bg-surface-highest'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label="Candidats inscrits" value={candidates || 1245} icon="group" trend={{ value: 12, direction: 'up' }} />
        <KpiCard label="Employeurs actifs" value={employers || 86} icon="apartment" trend={{ value: 5, direction: 'up' }} />
        <KpiCard label="Taux de matching" value="68%" icon="join_inner" />
        <KpiCard label="Taux de conversion" value="24%" icon="trending_flat" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-4">
          <h4 className="mb-6 text-lg font-bold text-onSurface">Inscriptions mensuelles</h4>
          <div className="relative h-64 w-full">
            <svg className="h-full w-full text-primary" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0 130 Q 50 110, 100 120 T 200 60 T 300 80 T 400 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
              <path d="M0 130 Q 50 110, 100 120 T 200 60 T 300 80 T 400 20 L 400 150 L 0 150 Z" fill="currentColor" fillOpacity="0.08" />
            </svg>
          </div>
          <div className="mt-4 flex justify-between px-2 text-xs font-medium text-onSurface-variant">
            <span>Jan</span><span>Mar</span><span>Mai</span><span>Juil</span><span>Sep</span><span>Nov</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-lowest p-6 text-center shadow-sm md:col-span-2">
          <h4 className="mb-6 text-lg font-bold text-onSurface">Complétion profil</h4>
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-highest" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="440" strokeDashoffset="123" className="text-primary transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary">72%</span>
              <span className="text-xs text-onSurface-variant">Moyenne</span>
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-onSurface-variant">Prêt pour Matching</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-3">
          <h4 className="mb-6 text-lg font-bold text-onSurface">Répartition par secteur</h4>
          <div className="space-y-4">
            {SECTOR_BREAKDOWN.map((s) => (
              <div key={s.label} className="space-y-1">
                <div className="flex justify-between text-sm font-medium text-onSurface">
                  <span>{s.label}</span><span>{s.value}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-3">
          <h4 className="mb-6 text-lg font-bold text-onSurface">Niveau d&apos;allemand</h4>
          <div className="flex h-40 items-end justify-between gap-2 pb-2">
            {CEFR_LEVELS.map((lvl) => (
              <div key={lvl} className="flex flex-1 flex-col items-center gap-1.5">
                <div
                  className="w-full rounded-t-sm bg-primary"
                  style={{ height: `${GERMAN_LEVEL_DISTRIBUTION[lvl]}%`, opacity: lvl === 'B1' ? 1 : 0.5 }}
                />
                <span className="text-xs font-semibold text-onSurface-variant">{lvl}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-onSurface">Top employeurs</h4>
            <button type="button" className="text-sm font-semibold text-primary hover:underline">Voir tout</button>
          </div>
          <div className="divide-y divide-outline-variant">
            {TOP_EMPLOYERS.map((emp, i) => (
              <div key={emp.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-low font-bold text-primary">{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium text-onSurface">{emp.name}</p>
                    <p className="text-xs text-onSurface-variant">{emp.sector}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">{emp.hires} recrutements</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-onSurface">Secteurs demandés</h4>
            <button type="button" className="text-sm font-semibold text-primary hover:underline">Analyses</button>
          </div>
          <div className="space-y-3">
            {DEMANDED_SECTORS.map((s) => (
              <div key={s.label} className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-low p-3">
                <span className="rounded-lg bg-primary-light p-2 text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-onSurface">{s.label}</p>
                  <p className="text-xs text-onSurface-variant">{s.openings} postes ouverts</p>
                </div>
                <span className="material-symbols-outlined text-onSurface-variant" style={{ fontSize: 18 }}>arrow_forward</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <div className="fixed bottom-6 right-6 z-30">
        <button
          type="button"
          className="flex items-center gap-2 rounded-full bg-primary px-6 py-4 text-onPrimary shadow-lg transition-all hover:shadow-xl active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>picture_as_pdf</span>
          <span className="text-sm font-bold">Exporter le rapport (PDF)</span>
        </button>
      </div>
    </div>
  );
}
