'use client';

// Interface 27 — Statistiques globales de la plateforme.

import { useState } from 'react';
import { KpiCard } from '@/components/shared/KpiCard';
import { MOCK_ADMIN_USERS, CEFR_LEVELS } from '@/lib/mockData';
import { useLanguage } from '@/context/LanguageContext';

const PERIODS = ['7d', '30d', '90d', '12m'] as const;

const SECTOR_BREAKDOWN = [
  { key: 'it', value: 42 },
  { key: 'sante', value: 26 },
  { key: 'btp', value: 18 },
  { key: 'artisanat', value: 9 },
  { key: 'autre', value: 5 },
];

const GERMAN_LEVEL_DISTRIBUTION: Record<(typeof CEFR_LEVELS)[number], number> = {
  A1: 20, A2: 45, B1: 85, B2: 60, C1: 15, C2: 5,
};

const TOP_EMPLOYERS = [
  { name: 'TechGmbH Munich', sectorKey: 'it', hires: 14 },
  { name: 'Helios Kliniken', sectorKey: 'sante', hires: 9 },
  { name: 'Nordbau Hamburg', sectorKey: 'btp', hires: 7 },
];

const DEMANDED_SECTORS = [
  { key: 'softwareDev', icon: 'code', openings: 38 },
  { key: 'nursing', icon: 'medical_services', openings: 26 },
  { key: 'warehouseManagement', icon: 'local_shipping', openings: 19 },
];

export default function AdminStatsPage() {
  const { t } = useLanguage();
  const [period, setPeriod] = useState<(typeof PERIODS)[number]>('7d');
  const candidates = MOCK_ADMIN_USERS.filter((u) => u.role === 'candidate').length;
  const employers = MOCK_ADMIN_USERS.filter((u) => u.role === 'employer').length;

  return (
    <div className="mx-auto max-w-[1200px] space-y-6 p-6 md:p-8">
      <section className="space-y-3">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-primary">{t('admin:statistiques.title')}</h1>
          <button type="button" className="flex items-center gap-1.5 text-sm font-semibold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>calendar_today</span>
            {t('admin:statistiques.filters')}
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
              {t(`admin:statistiques.periods.${p}`)}
            </button>
          ))}
        </div>
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-4">
        <KpiCard label={t('admin:statistiques.kpi.registeredCandidates')} value={candidates || 1245} icon="group" trend={{ value: 12, direction: 'up' }} />
        <KpiCard label={t('admin:statistiques.kpi.activeEmployers')} value={employers || 86} icon="apartment" trend={{ value: 5, direction: 'up' }} />
        <KpiCard label={t('admin:statistiques.kpi.matchingRate')} value="68%" icon="join_inner" />
        <KpiCard label={t('admin:statistiques.kpi.conversionRate')} value="24%" icon="trending_flat" />
      </section>

      <section className="grid grid-cols-1 gap-4 md:grid-cols-6">
        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-4">
          <h4 className="mb-6 text-lg font-bold text-onSurface">{t('admin:statistiques.charts.monthlyRegistrations')}</h4>
          <div className="relative h-64 w-full">
            <svg className="h-full w-full text-primary" viewBox="0 0 400 150" preserveAspectRatio="none">
              <path d="M0 130 Q 50 110, 100 120 T 200 60 T 300 80 T 400 20" fill="none" stroke="currentColor" strokeLinecap="round" strokeWidth="4" />
              <path d="M0 130 Q 50 110, 100 120 T 200 60 T 300 80 T 400 20 L 400 150 L 0 150 Z" fill="currentColor" fillOpacity="0.08" />
            </svg>
          </div>
          <div className="mt-4 flex justify-between px-2 text-xs font-medium text-onSurface-variant">
            <span>{t('admin:statistiques.charts.months.jan')}</span><span>{t('admin:statistiques.charts.months.mar')}</span><span>{t('admin:statistiques.charts.months.mai')}</span><span>{t('admin:statistiques.charts.months.juil')}</span><span>{t('admin:statistiques.charts.months.sep')}</span><span>{t('admin:statistiques.charts.months.nov')}</span>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center rounded-xl border border-outline-variant bg-surface-lowest p-6 text-center shadow-sm md:col-span-2">
          <h4 className="mb-6 text-lg font-bold text-onSurface">{t('admin:statistiques.charts.profileCompletion')}</h4>
          <div className="relative flex h-40 w-40 items-center justify-center">
            <svg className="h-full w-full -rotate-90 transform">
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" className="text-surface-highest" />
              <circle cx="80" cy="80" r="70" fill="transparent" stroke="currentColor" strokeWidth="12" strokeDasharray="440" strokeDashoffset="123" className="text-primary transition-all duration-1000 ease-out" />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold text-primary">72%</span>
              <span className="text-xs text-onSurface-variant">{t('admin:statistiques.charts.average')}</span>
            </div>
          </div>
          <p className="mt-6 text-sm font-medium text-onSurface-variant">{t('admin:statistiques.charts.readyForMatching')}</p>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-3">
          <h4 className="mb-6 text-lg font-bold text-onSurface">{t('admin:statistiques.charts.sectorBreakdown')}</h4>
          <div className="space-y-4">
            {SECTOR_BREAKDOWN.map((s) => (
              <div key={s.key} className="space-y-1">
                <div className="flex justify-between text-sm font-medium text-onSurface">
                  <span>{t(`admin:statistiques.sectors.${s.key}`)}</span><span>{s.value}%</span>
                </div>
                <div className="h-3 w-full overflow-hidden rounded-full bg-surface-highest">
                  <div className="h-full rounded-full bg-primary" style={{ width: `${s.value}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm md:col-span-3">
          <h4 className="mb-6 text-lg font-bold text-onSurface">{t('admin:statistiques.charts.germanLevel')}</h4>
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
            <h4 className="text-lg font-bold text-onSurface">{t('admin:statistiques.topEmployers.title')}</h4>
            <button type="button" className="text-sm font-semibold text-primary hover:underline">{t('admin:shared.seeAll')}</button>
          </div>
          <div className="divide-y divide-outline-variant">
            {TOP_EMPLOYERS.map((emp, i) => (
              <div key={emp.name} className="flex items-center justify-between py-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-surface-low font-bold text-primary">{i + 1}</div>
                  <div>
                    <p className="text-sm font-medium text-onSurface">{emp.name}</p>
                    <p className="text-xs text-onSurface-variant">{t(`admin:statistiques.sectors.${emp.sectorKey}`)}</p>
                  </div>
                </div>
                <span className="text-sm font-medium text-primary">{t('admin:statistiques.topEmployers.hires', { count: emp.hires })}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-xl border border-outline-variant bg-surface-lowest p-6 shadow-sm">
          <div className="mb-6 flex items-center justify-between">
            <h4 className="text-lg font-bold text-onSurface">{t('admin:statistiques.demandedSectors.title')}</h4>
            <button type="button" className="text-sm font-semibold text-primary hover:underline">{t('admin:statistiques.demandedSectors.analyses')}</button>
          </div>
          <div className="space-y-3">
            {DEMANDED_SECTORS.map((s) => (
              <div key={s.key} className="flex items-center gap-3 rounded-lg border border-outline-variant/30 bg-surface-low p-3">
                <span className="rounded-lg bg-primary-light p-2 text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 20 }}>{s.icon}</span>
                </span>
                <div className="flex-1">
                  <p className="text-sm font-medium text-onSurface">{t(`admin:statistiques.demandedSectors.items.${s.key}`)}</p>
                  <p className="text-xs text-onSurface-variant">{t('admin:statistiques.demandedSectors.openings', { count: s.openings })}</p>
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
          <span className="text-sm font-bold">{t('admin:statistiques.exportPdf')}</span>
        </button>
      </div>
    </div>
  );
}
