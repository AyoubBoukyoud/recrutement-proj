'use client';

// Page : Recherche & filtres candidats Employeur (Interactif avec Favoris & Score)

import { useMemo, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { FilterPanel } from '@/components/shared/FilterPanel';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { useLanguage } from '@/context/LanguageContext';
import { MOCK_CANDIDATES, SECTORS } from '@/lib/mockData';

const CEFR_LEVELS = ['Tous', 'A1', 'A2', 'B1', 'B2', 'C1'];

export default function EmployerSearchPage() {
  const { t } = useLanguage();
  const [query, setQuery] = useState('');
  const [sector, setSector] = useState<string | null>(null);
  const [minExperience, setMinExperience] = useState(0);
  const [cefrFilter, setCefrFilter] = useState<string>('Tous');
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const results = useMemo(() => {
    return MOCK_CANDIDATES.filter((c) => {
      const matchesQuery = query
        ? `${c.name} ${c.role}`.toLowerCase().includes(query.toLowerCase())
        : true;
      const matchesSector = sector ? c.sector === sector : true;
      const matchesExperience = c.yearsExperience >= minExperience;
      const matchesCefr = cefrFilter === 'Tous' ? true : c.languageLevel.includes(cefrFilter);
      return matchesQuery && matchesSector && matchesExperience && matchesCefr;
    });
  }, [query, sector, minExperience, cefrFilter]);

  const handleSearch = (value: string) => {
    setQuery(value);
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 250);
  };

  const toggleFavorite = (candidateId: string, candidateName: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setFavorites((prev) => {
      const next = new Set(prev);
      if (next.has(candidateId)) {
        next.delete(candidateId);
        toast(`Retiré des favoris : ${candidateName}`, { icon: '💔', position: 'bottom-right' });
      } else {
        next.add(candidateId);
        toast.success(`Ajouté aux favoris : ${candidateName}`, { icon: '❤️', position: 'bottom-right' });
      }
      return next;
    });
  };

  return (
    <div className="min-h-screen bg-surface pb-8">
      <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6 md:px-8">
        <div className="flex items-center gap-3">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>account_balance</span>
          <h1 className="text-xl font-extrabold text-primary">{t('employer:recherche.title')}</h1>
        </div>
        {favorites.size > 0 && (
          <span className="flex items-center gap-1 rounded-full bg-error/10 px-3 py-1 text-xs font-bold text-error border border-error/30">
            <span className="material-symbols-outlined fill" style={{ fontSize: 16 }}>favorite</span>
            {favorites.size} Favori(s)
          </span>
        )}
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
              className="w-full rounded-xl border border-outline-variant bg-surface-lowest py-3 pl-12 pr-4 text-sm font-bold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
          <button
            type="button"
            onClick={() => setIsFilterOpen(true)}
            className="flex h-[50px] w-[50px] shrink-0 items-center justify-center rounded-xl bg-primary text-onPrimary transition-all hover:opacity-90 active:scale-95 shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>filter_list</span>
          </button>
        </div>

        {/* Sectors and CEFR Filters */}
        <div className="mx-auto mt-3 flex max-w-[1200px] gap-2 overflow-x-auto pb-1">
          <button
            type="button"
            onClick={() => setSector(null)}
            className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
              sector === null ? 'bg-primary text-onPrimary shadow-sm' : 'border border-outline-variant text-onSurface-variant hover:bg-surface-container'
            }`}
          >
            {t('employer:recherche.allSectors')}
          </button>
          {SECTORS.map((s) => (
            <button
              key={s}
              type="button"
              onClick={() => setSector(sector === s ? null : s)}
              className={`whitespace-nowrap rounded-full px-4 py-2 text-xs font-extrabold transition-all ${
                sector === s ? 'bg-primary text-onPrimary shadow-sm' : 'border border-outline-variant text-onSurface-variant hover:bg-surface-container'
              }`}
            >
              {s}
            </button>
          ))}
        </div>

        {/* Quick CEFR Filter Bar */}
        <div className="mx-auto mt-2 flex max-w-[1200px] items-center gap-2 overflow-x-auto text-xs font-semibold text-onSurface-variant">
          <span className="text-[11px] uppercase font-bold text-outline">Niveau Allemand:</span>
          {CEFR_LEVELS.map((lvl) => (
            <button
              key={lvl}
              type="button"
              onClick={() => setCefrFilter(lvl)}
              className={`rounded-full px-3 py-1 text-xs font-bold transition-all ${
                cefrFilter === lvl
                  ? 'bg-secondary text-onSecondary shadow-sm'
                  : 'bg-surface-container-high text-onSurface-variant hover:bg-surface-container-highest'
              }`}
            >
              {lvl}
            </button>
          ))}
        </div>
      </div>

      <main className="mx-auto max-w-[1200px] px-6 py-6 md:px-8">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <p className="text-lg font-extrabold text-onSurface">{t('employer:recherche.resultsCount', { count: results.length })}</p>
            <p className="text-xs text-outline">{t('employer:recherche.updatedNow')}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {isLoading ? (
            <SkeletonLoader variant="card" count={3} />
          ) : (
            results.map((candidate) => {
              const isFav = favorites.has(candidate.id);
              return (
                <Link
                  key={candidate.id}
                  href={`/employer/candidat/${candidate.id}`}
                  className="group relative flex flex-col gap-4 rounded-2xl border border-outline-variant bg-surface-lowest p-5 shadow-sm transition-all hover:border-primary/50 hover:shadow-md md:flex-row md:p-6"
                >
                  <div className="flex h-24 w-full shrink-0 items-center justify-center rounded-xl bg-primary/10 text-2xl font-black text-primary md:w-32 shadow-inner">
                    {candidate.avatarInitials}
                  </div>
                  <div className="flex-grow">
                    <div className="mb-1 flex items-start justify-between gap-2">
                      <div>
                        <h3 className="text-lg font-black text-onSurface group-hover:text-primary transition-colors">{candidate.name}</h3>
                        <p className="text-xs font-medium text-outline">{t('employer:recherche.cityMorocco', { city: candidate.city })}</p>
                      </div>

                      {/* Favorite Button */}
                      <button
                        type="button"
                        onClick={(e) => toggleFavorite(candidate.id, candidate.name, e)}
                        className="rounded-full p-2 transition-transform active:scale-90 hover:bg-surface-container-low"
                        title={isFav ? 'Retirer des favoris' : 'Ajouter aux favoris'}
                      >
                        <span
                          className={`material-symbols-outlined transition-colors ${
                            isFav ? 'fill text-error' : 'text-outline hover:text-error'
                          }`}
                          style={{ fontSize: 24 }}
                        >
                          favorite
                        </span>
                      </button>
                    </div>

                    <p className="mb-3 text-sm font-extrabold text-primary">{candidate.role}</p>

                    <div className="mb-3 flex flex-wrap gap-2">
                      <span className="rounded-full bg-primary/10 px-3 py-1 text-[11px] font-extrabold text-primary">
                        {candidate.languageLevel}
                      </span>
                      <span className="rounded-full bg-surface-container-high px-3 py-1 text-[11px] font-bold text-onSurface-variant">
                        {candidate.sector}
                      </span>
                      <span className="rounded-full bg-gold/20 px-3 py-1 text-[11px] font-bold text-tertiary">
                        {t(`employer:recherche.status.${candidate.status}`)}
                      </span>
                    </div>

                    <div className="flex flex-col items-start justify-between gap-3 md:flex-row md:items-center">
                      <div className="flex items-center gap-2">
                        <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>event_available</span>
                        <span className="text-xs font-medium text-onSurface-variant">
                          {candidate.yearsExperience} ans d'exp. • Score Matching: <span className="font-black text-primary">{candidate.matchScore}%</span>
                        </span>
                      </div>
                      <span className="w-full rounded-xl bg-primary px-6 py-2.5 text-center text-xs font-extrabold text-onPrimary shadow-md transition-transform active:scale-95 md:w-auto">
                        {t('employer:recherche.viewProfile')}
                      </span>
                    </div>
                  </div>
                </Link>
              );
            })
          )}
          {!isLoading && results.length === 0 && (
            <div className="rounded-2xl bg-surface-container-lowest border border-outline-variant p-8 text-center space-y-2">
              <span className="material-symbols-outlined text-4xl text-outline">search_off</span>
              <p className="text-base font-bold text-onSurface">Aucun candidat ne correspond à ces critères</p>
              <p className="text-xs text-outline">Essayez de réinitialiser vos filtres ou de modifier votre recherche.</p>
            </div>
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
          setCefrFilter('Tous');
        }}
      >
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface-variant">{t('employer:recherche.sectorLabel')}</label>
          <div className="flex flex-wrap gap-2">
            {SECTORS.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setSector(sector === s ? null : s)}
                className={`rounded-full border-2 px-3.5 py-1.5 text-xs font-extrabold transition-all ${
                  sector === s ? 'border-primary bg-primary/10 text-primary' : 'border-outline-variant text-onSurface-variant'
                }`}
              >
                {s}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-onSurface-variant">
            Expérience minimale: <span className="text-primary font-black">{minExperience} an(s)</span>
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

