'use client';

// Interface 19 — Recherche & filtres candidats.

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/context/LanguageContext';
import { MOCK_CANDIDATES, SECTORS } from '@/lib/mockData';

export default function EmployerSearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [minExperience, setMinExperience] = useState(0);
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const results = useMemo(() => {
    return MOCK_CANDIDATES.filter((c) => {
      const matchesQuery = query
        ? `${c.name} ${c.role}`.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesSector = sector ? c.sector === sector : true;
      const matchesExperience = c.yearsExperience >= minExperience;
      return matchesQuery && matchesSector && matchesExperience;
    });
  }, [query, sector, minExperience]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 300);
  };

  return (
    <div className="min-h-screen bg-surface pb-8">
      <header className="flex h-16 items-center gap-4 border-b border-outline-variant bg-surface px-6 md:px-8">
        <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>account_balance</span>
        <h1 className="text-xl font-bold text-primary">{t('employer:recherche.title')}</h1>
      </header>

      <div className="sticky top-0 z-20 border-b border-outline-variant bg-surface/95 px-6 py-4 backdrop-blur-md md:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center gap-3">
          <div className="relative flex-grow">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" style={{ fontSize: 20 }}>
              search
            </span>
            <input
              value={query}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder={t('employer:recherche.placeholder')}
              className="w-full rounded-xl border border-outline-variant bg-surface-lowest py-3 pl-12 pr-4 text-sm outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-primary text-onPrimary transition-all hover:opacity-90 active:scale-95"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>filter_list</span>
          </button>
        </div>
        <div className="mx-auto mt-3 flex max-w-[1200px] gap-2 overflow-x-auto">
          <button
            type="button"
            onClick={() => setSector(null)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
              sector === null ? 'bg-primary text-onPrimary' : 'border border-outline-variant text-onSurface-variant hover:bg-surface-container'
            }`}
          >
            {t('employer:recherche.allSectors')}
          </button>
          {SECTORS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(sector === s ? null : s)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                sector === s ? 'bg-primary text-onPrimary' : 'border border-outline-variant text-onSurface-variant hover:bg-surface-container'
              }`}
            >
              {s}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-bold text-onSurface">{t('employer:recherche.resultsCount', { count: results.length })}</p>
            <p className="text-xs text-outline">{t('employer:recherche.updatedNow')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : (
            results.map((candidate) => (
              <Link
                key={candidate.id}
                href={`/employer/candidat/${candidate.id}`}
                className="flex flex-col gap-4 rounded-xl border border-outline-variant bg-surface-lowest p-4 shadow-sm transition-all hover:border-primary/40 hover:shadow-md md:flex-row md:p-6"
              >
                <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-lg bg-primary-light text-2xl font-bold text-primary md:w-32">
                  {candidate.avatarInitials}
                </div>
                <div className="flex-grow">
                  <div className="mb-1 flex items-start justify-between gap-2">
                    <div>
                      <h3 className="text-lg font-bold text-onSurface">{candidate.name}</h3>
                      <p className="text-sm text-outline">{t('employer:recherche.cityMorocco', { city: candidate.city })}</p>
                    </div>
                    <span className="material-symbols-outlined shrink-0 text-outline transition-colors hover:text-secondary" style={{ fontSize: 20 }}>
                      favorite
                    </span>
                  </div>
                  <p className="mb-3 text-sm font-bold text-primary">{candidate.role}</p>
                  <div className="mb-3 flex flex-wrap gap-2">
                    <span className="rounded-full bg-primary-light px-3 py-1 text-[11px] font-bold text-onPrimary-container">
                      {candidate.languageLevel}
                    </span>
                    <span className="rounded-full bg-surface-high px-3 py-1 text-[11px] font-bold text-onSurface-variant">
                      {candidate.sector}
                    </span>
                    <span className="rounded-full bg-gold-light px-3 py-1 text-[11px] font-bold text-gold-dark">
                      {t(`employer:recherche.status.${candidate.status}`)}
                    </span>
                  </div>
                  <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                    <div className="flex items-center gap-2">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>event_available</span>
                      <span className="text-xs text-onSurface-variant">
                        {t('employer:recherche.yearsExperienceMatchPrefix', { years: candidate.yearsExperience })} <span dir="ltr">{candidate.matchScore}%</span>
                      </span>
                    </div>
                    <span className="w-full rounded-lg bg-primary px-6 py-2 text-center text-sm font-semibold text-onPrimary shadow-sm md:w-auto">
                      {t('employer:recherche.viewProfile')}
                    </span>
                  </div>
                </div>
              </Link>
            ))
          )}
          {!isLoading && results.length === 0 && (
            <p className="rounded-xl bg-surface-container p-6 text-center text-sm text-onSurface-variant">
              {t('employer:recherche.noResults')}
            </p>
          )}
        </div>
      </main>

      <FilterPanel
        title={t('employer:recherche.filtersTitle')}
        isOpen={isFilterOpen}
        onClose={() => setIsFilterOpen(false)}
        onReset={() => {
          setSector(null);
          setMinExperience(0);
        }}
      >
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-onSurface-variant">{t('employer:recherche.sectorLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(sector === s ? null : s)}
                className={`rounded-full border-2 px-3 py-1.5 text-xs font-semibold transition-colors ${
                  sector === s ? 'border-primary bg-primary-light/40 text-primary' : 'border-outline-variant text-onSurface-variant'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-semibold text-onSurface-variant">
            {t('employer:recherche.minExperiencePrefix')} <span dir="ltr">{minExperience}</span> {t('employer:recherche.minExperienceSuffix')}
          </label>
          <input
            type="range"
            min={0}
            max={15}
            value={minExperience}
            onChange={(e) => setMinExperience(Number(e.target.value))}
            className="w-full accent-primary"
          />
        </div>
      </FilterPanel>
    </div>
  );
}
