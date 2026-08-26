'use client';

// Page : Offres d'emploi - Candidat (Stitch exact template)

import Link from 'next/link';
import { Button, IconButton } from '@/components/shared/Button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useEffect, useMemo, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { candidateOffresContentFor, filterLabelFor } from '@/lib/candidateOffresContent';
import { JOB_OFFERS, listFavoriteIds, toggleFavorite as persistToggleFavorite, listAppliedIds, applyToJob } from '@/data/jobOffers';

// Valeurs canoniques (français) des puces de filtre : servent de clé de
// comparaison (`selectedFilter === filter`) pour le style actif/inactif.
// L'affichage traduit passe par `filterLabelFor`.
const FILTERS = ['Santé', 'Électricité', 'Hôtellerie', 'Logistique', 'Disponibilité immédiate'];

export default function OffresPage() {
  const { language } = useLanguage();
  const content = candidateOffresContentFor(language);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [appliedIds, setAppliedIds] = useState<string[]>([]);
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tous');

  useEffect(() => {
    setFavorites(listFavoriteIds());
    setAppliedIds(listAppliedIds());
  }, []);

  const toggleFavorite = (id: string) => setFavorites(persistToggleFavorite(id));

  const apply = (id: string) => setAppliedIds(applyToJob(id).map((a) => a.jobId));

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    return JOB_OFFERS.filter((job) => {
      const matchesQuery =
        query === '' || job.title.toLowerCase().includes(query) || job.company.toLowerCase().includes(query) || job.location.toLowerCase().includes(query);
      const matchesFilter =
        selectedFilter === 'Tous' ||
        (selectedFilter === 'Disponibilité immédiate'
          ? job.badges.some((badge) => badge.type === 'urgent')
          : job.sector === selectedFilter);
      return matchesQuery && matchesFilter;
    });
  }, [search, selectedFilter]);

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-1.5 shadow-subtle lg:px-4">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 overflow-hidden rounded-full border border-outline-variant">
            <img
              className="h-full w-full object-cover"
              alt={content.header.profileAlt}
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuCPqRi7uOfHx4qDLV3jcEYoiF5AeUAPOc9qwHNBwrI3wC8MvbITgV3g32wcLhQlFGqGBuuxUGOv12XjyPxoXY7ZZJiaFzsICmrDZN57TVLXDlqjl3_eI3sDYP_kGv3aG47XF1zb1DuuqDlgMeTYavqAUHjR15B-aeEAqM-bnUplCp6qX_HuelHwo1wJPJCEq8Jm1oZU2JOxIk1duMeR6GmVR9HUmXijT09cjIn0dUaJ5hcxHwYu9Rof"
            />
          </div>
          <h1 className="text-lg font-extrabold text-primary">Amud Careers</h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <IconButton variant="ghost" aria-label={content.header.notificationsAria}>
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              notifications
            </span>
          </IconButton>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-6 lg:max-w-6xl lg:px-10 lg:py-8">
        {/* Header & Search */}
        <div className="mb-6 lg:max-w-xl">
          <h2 className="mb-3 text-2xl font-extrabold text-primary">{content.search.title}</h2>
          <div className="relative w-full">
            <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-outline" aria-hidden="true" style={{ fontSize: 20 }}>
              search
            </span>
            <label htmlFor="offres-search" className="sr-only">{content.search.srLabel}</label>
            <input
              id="offres-search"
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder={content.search.placeholder}
              className="w-full rounded-xl border border-outline bg-surface-container-lowest py-3 pl-12 pr-4 text-sm font-semibold text-onSurface outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
        </div>

        {/* Filters Section */}
        <div className="mb-6 flex items-center gap-2 overflow-x-auto pb-2 lg:flex-wrap lg:overflow-visible">
          <Button
            variant={selectedFilter === 'Tous' ? 'primary' : 'outline'}
            size="sm"
            pill
            onClick={() => setSelectedFilter('Tous')}
            aria-pressed={selectedFilter === 'Tous'}
            className="shrink-0 gap-1.5 shadow-sm"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
              tune
            </span>
            <span>{content.filters.button}</span>
          </Button>
          <div className="h-6 w-px shrink-0 bg-outline-variant" />
          {FILTERS.map((filter) => (
            <Button
              key={filter}
              variant={selectedFilter === filter ? 'primary' : 'outline'}
              size="sm"
              pill
              onClick={() => setSelectedFilter(filter)}
              aria-pressed={selectedFilter === filter}
              className="shrink-0 whitespace-nowrap"
            >
              {filterLabelFor(content, filter)}
            </Button>
          ))}
        </div>

        {/* Jobs Grid/List */}
        {filteredOffers.length === 0 && (
          <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
            {content.job.noResults}
          </p>
        )}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {filteredOffers.map((job) => {
            const isFav = favorites.includes(job.id);
            const isApplied = appliedIds.includes(job.id);
            return (
              <div
                key={job.id}
                className="flex flex-col justify-between rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-5 shadow-subtle transition-all duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-lg border border-outline-variant bg-surface-container-high p-1">
                        <img className="h-10 w-10 object-contain" alt={job.company} src={job.logo} />
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-onSurface">{job.title}</h3>
                        <p className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant mt-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            {job.companyIcon}
                          </span>{' '}
                          {job.company}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite(job.id)}
                      aria-pressed={isFav}
                      aria-label={isFav ? content.job.removeFavoriteAria : content.job.addFavoriteAria}
                      className={isFav ? 'text-secondary-dark' : 'text-outline hover:enabled:text-secondary-dark'}
                    >
                      <span className={`material-symbols-outlined ${isFav ? 'fill' : ''}`} style={{ fontSize: 22 }}>
                        favorite
                      </span>
                    </IconButton>
                  </div>

                  <div className="mb-5 space-y-2">
                    <div className="flex items-center gap-2 text-xs font-medium text-onSurface-variant">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                        location_on
                      </span>
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-2 text-xs font-medium text-onSurface-variant">
                      <span className="material-symbols-outlined text-primary" style={{ fontSize: 16 }}>
                        payments
                      </span>
                      <span className="font-extrabold text-onSurface">{job.salary}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 pt-1">
                      {job.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`rounded-md px-2.5 py-1 text-[11px] font-bold ${
                            badge.type === 'secondary'
                              ? 'bg-secondary/20 text-tertiary'
                              : badge.type === 'tertiary'
                              ? 'bg-gold/20 text-tertiary'
                              : badge.type === 'urgent'
                              ? 'bg-error/15 text-error'
                              : 'bg-surface-container-high text-onSurface-variant'
                          }`}
                        >
                          {badge.text}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>

                <Button
                  variant={isApplied ? 'tonal' : 'secondary'}
                  fullWidth
                  disabled={isApplied}
                  onClick={() => apply(job.id)}
                  className="text-xs font-extrabold uppercase tracking-wider shadow-sm"
                >
                  {isApplied ? content.job.appliedButton : content.job.interestedButton}
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                    {isApplied ? 'check_circle' : 'arrow_forward'}
                  </span>
                </Button>
              </div>
            );
          })}
        </div>

        {/* Featured Banner */}
        <div className="relative mt-8 overflow-hidden rounded-2xl bg-primary p-6 text-onPrimary shadow-lg">
          <div className="relative z-10">
            <h3 className="mb-2 text-xl font-extrabold">{content.banner.title}</h3>
            <p className="mb-4 text-xs leading-relaxed text-onPrimary/90">{content.banner.body}</p>
            <Link
              href="/visibilite"
              className="inline-block rounded-lg bg-onPrimary px-5 py-2.5 text-xs font-extrabold text-primary transition-colors hover:bg-surface-container-low"
            >
              {content.banner.cta}
            </Link>
          </div>
          <span className="material-symbols-outlined absolute -bottom-4 -right-4 text-[120px] text-onPrimary/10 pointer-events-none">
            trending_up
          </span>
        </div>
      </main>
    </div>
  );
}
