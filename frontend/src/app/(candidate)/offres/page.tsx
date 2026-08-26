'use client';

// Page : Offres d'emploi - Candidat (Stitch exact template)
//
// L'habillage vient de la maquette Stitch ; les offres, favoris et
// candidatures viennent de l'API réelle (`/offers`, `/candidate/favorites`,
// `/candidate/applications` via `marketplaceApi`).
//
// La maquette était bâtie sur `@/data/jobOffers`, dont le modèle est plus
// riche que celui du back (logo, nom d'entreprise, score de correspondance).
// `toCardView` ci-dessous fait la conversion et n'affiche que ce que l'API
// fournit réellement — pas de logo ni d'entreprise inventés.

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Button, IconButton } from '@/components/shared/Button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { candidateOffresContentFor, filterLabelFor } from '@/lib/candidateOffresContent';
import { marketplaceApi, type JobOffer, type JobApplication, type Page } from '@/lib/candidateMarketplace';

// Valeurs canoniques (français) des puces de filtre : servent de clé de
// comparaison (`selectedFilter === filter`) pour le style actif/inactif.
// L'affichage traduit passe par `filterLabelFor`.
const FILTERS = ['Santé', 'Électricité', 'Hôtellerie', 'Logistique', 'Disponibilité immédiate'];

type BadgeType = 'secondary' | 'tertiary' | 'neutral' | 'urgent';

/** Une offre de l'API, réduite à ce que la carte de la maquette sait afficher. */
type CardView = {
  id: number;
  title: string;
  subtitle: string;
  location: string;
  salary: string;
  sector: string;
  badges: { text: string; type: BadgeType }[];
  immediate: boolean;
};

function formatSalary(offer: JobOffer): string {
  if (offer.salary_min == null && offer.salary_max == null) return '—';
  const min = offer.salary_min?.toLocaleString('fr-FR');
  const max = offer.salary_max?.toLocaleString('fr-FR');
  if (min && max) return `${min} - ${max} ${offer.currency}`;
  return `${min ?? max} ${offer.currency}`;
}

function toCardView(offer: JobOffer): CardView {
  const badges: { text: string; type: BadgeType }[] = [];
  if (offer.required_cefr_level) badges.push({ text: `${offer.required_cefr_level} requis`, type: 'secondary' });
  if (offer.contract_type) badges.push({ text: offer.contract_type, type: 'neutral' });

  // « Disponibilité immédiate » n'existe pas comme champ côté back : la
  // maquette s'appuyait sur un badge `urgent`. On l'approxime par une
  // publication récente (moins de 14 jours), seule donnée temporelle fournie.
  const publishedAt = Date.parse(offer.published_at);
  const immediate = Number.isFinite(publishedAt) && Date.now() - publishedAt < 14 * 24 * 60 * 60 * 1000;
  if (immediate) badges.push({ text: 'Publiée récemment', type: 'urgent' });

  return {
    id: offer.id,
    title: offer.title,
    // Le back ne renvoie pas d'entreprise : le secteur tient ce rôle de
    // sous-titre plutôt que d'afficher un nom inventé.
    subtitle: offer.sector,
    location: [offer.city, offer.country].filter(Boolean).join(', '),
    salary: formatSalary(offer),
    sector: offer.sector,
    badges,
    immediate,
  };
}

export default function OffresPage() {
  const { language } = useLanguage();
  const content = candidateOffresContentFor(language);
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [search, setSearch] = useState('');
  const [selectedFilter, setSelectedFilter] = useState('Tous');

  const offersQuery = useQuery<Page<JobOffer>>({
    queryKey: ['offers'],
    queryFn: () => marketplaceApi.offers(token as string),
    enabled: Boolean(token),
  });

  const favoritesQuery = useQuery<Page<JobOffer>>({
    queryKey: ['candidate-favorites'],
    queryFn: () => marketplaceApi.favorites(token as string),
    enabled: Boolean(token),
  });

  const applicationsQuery = useQuery<Page<JobApplication>>({
    queryKey: ['candidate-applications'],
    queryFn: () => marketplaceApi.applications(token as string),
    enabled: Boolean(token),
  });

  const favoriteIds = useMemo(
    () => new Set((favoritesQuery.data?.data ?? []).map((o) => o.id)),
    [favoritesQuery.data],
  );
  const appliedIds = useMemo(
    () => new Set((applicationsQuery.data?.data ?? []).map((a) => a.offer.id)),
    [applicationsQuery.data],
  );

  const toggleFavorite = useMutation({
    mutationFn: ({ id, isFav }: { id: number; isFav: boolean }) =>
      isFav ? marketplaceApi.unfavorite(id, token as string) : marketplaceApi.favorite(id, token as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidate-favorites'] }),
  });

  const apply = useMutation({
    mutationFn: (id: number) => marketplaceApi.apply(id, token as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['candidate-applications'] }),
  });

  const filteredOffers = useMemo(() => {
    const query = search.trim().toLowerCase();
    // Filtrage côté client, comme la maquette : les libellés de puces sont des
    // secteurs en français figés ici, on ne les envoie donc pas au back (dont
    // les valeurs de `sector` peuvent différer) — « Tous » reste toujours juste.
    return (offersQuery.data?.data ?? []).map(toCardView).filter((job) => {
      const matchesQuery =
        query === '' ||
        job.title.toLowerCase().includes(query) ||
        job.subtitle.toLowerCase().includes(query) ||
        job.location.toLowerCase().includes(query);
      const matchesFilter =
        selectedFilter === 'Tous' ||
        (selectedFilter === 'Disponibilité immédiate' ? job.immediate : job.sector === selectedFilter);
      return matchesQuery && matchesFilter;
    });
  }, [search, selectedFilter, offersQuery.data]);

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      {/* TopAppBar */}
      <header className="sticky top-0 z-40 flex h-16 w-full items-center justify-between border-b border-outline-variant bg-surface px-1.5 shadow-subtle lg:px-4">
        <div className="flex items-center gap-3">
          <Link href="/dashboard" aria-label="Retour" className="flex h-10 w-10 items-center justify-center text-primary">
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
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

        {/* États de chargement / erreur */}
        {offersQuery.isLoading && (
          <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">Chargement…</p>
        )}
        {offersQuery.isError && (
          <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4 text-center text-sm font-medium text-error">
            Impossible de charger les offres.
          </p>
        )}

        {/* Jobs Grid/List */}
        {!offersQuery.isLoading && !offersQuery.isError && filteredOffers.length === 0 && (
          <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
            {content.job.noResults}
          </p>
        )}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-5 lg:space-y-0 xl:grid-cols-3">
          {filteredOffers.map((job) => {
            const isFav = favoriteIds.has(job.id);
            const isApplied = appliedIds.has(job.id);
            return (
              <div
                key={job.id}
                className="flex flex-col justify-between rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-5 shadow-subtle transition-all duration-200 hover:-translate-y-1"
              >
                <div>
                  <div className="mb-4 flex items-start justify-between">
                    <div className="flex gap-3">
                      <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-lg border border-outline-variant bg-surface-container-high text-primary">
                        <span className="material-symbols-outlined" style={{ fontSize: 26 }}>work</span>
                      </div>
                      <div>
                        <h3 className="text-base font-extrabold text-onSurface">{job.title}</h3>
                        <p className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant mt-0.5">
                          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
                            domain
                          </span>{' '}
                          {job.subtitle}
                        </p>
                      </div>
                    </div>
                    <IconButton
                      variant="ghost"
                      size="sm"
                      onClick={() => toggleFavorite.mutate({ id: job.id, isFav })}
                      disabled={toggleFavorite.isPending}
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
                  disabled={isApplied || apply.isPending}
                  onClick={() => apply.mutate(job.id)}
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

        {apply.isError && (
          <p role="alert" className="mt-4 text-sm text-error">
            {apply.error instanceof Error ? apply.error.message : 'Impossible de postuler.'}
          </p>
        )}

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
