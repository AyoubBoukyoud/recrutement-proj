"use client";

// Searchable, filterable and paginated candidate offer catalogue.

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button, IconButton } from "@/components/shared/Button";
import { Pagination } from "@/components/Pagination";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidateProfile } from "@/lib/useCandidateProfile";
import { candidateOffresContentFor } from "@/lib/candidateOffresContent";
import {
  marketplaceApi,
  type ContractType,
  type JobOffer,
  type OfferFilters,
} from "@/lib/candidateMarketplace";
import { CEFR_LEVELS, type CefrLevel } from "@/lib/candidateProfile";
import { ApiError } from "@/lib/api";

const CEFR_RANK: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};
const CONTRACT_TYPES: ContractType[] = [
  "permanent",
  "fixed_term",
  "apprenticeship",
  "temporary",
  "internship",
];

function formatSalary(offer: JobOffer, locale: string): string {
  if (offer.salary_min == null && offer.salary_max == null) return "—";
  const min = offer.salary_min?.toLocaleString(locale);
  const max = offer.salary_max?.toLocaleString(locale);
  return `${min && max ? `${min} – ${max}` : (min ?? max)} ${offer.currency}`;
}

export default function OffresPage() {
  const { language } = useLanguage();
  const content = candidateOffresContentFor(language);
  const { token } = useAuth();
  const { data: profile } = useCandidateProfile();
  const queryClient = useQueryClient();
  const initialized = useRef(false);
  const [page, setPage] = useState(1);
  const [draft, setDraft] = useState<OfferFilters>({});
  const [filters, setFilters] = useState<OfferFilters>({});

  useEffect(() => {
    if (!profile || initialized.current) return;
    initialized.current = true;
    const preferred = {
      sector: profile.matching_preferences?.sectors?.[0],
      city: profile.matching_preferences?.regions?.[0],
    };
    setDraft(preferred);
    setFilters(preferred);
  }, [profile]);

  const offers = useQuery({
    queryKey: ["offers", filters, page],
    queryFn: () => marketplaceApi.offers(token as string, { ...filters, page }),
    enabled: Boolean(token),
  });
  const favorites = useQuery({
    queryKey: ["candidate-favorites", "offer-ids"],
    queryFn: () => marketplaceApi.favorites(token as string, 1, 100),
    enabled: Boolean(token),
  });
  const applications = useQuery({
    queryKey: ["candidate-applications", "offer-ids"],
    queryFn: () => marketplaceApi.applications(token as string, 1, 100),
    enabled: Boolean(token),
  });
  const favoriteIds = useMemo(
    () => new Set((favorites.data?.data ?? []).map((offer) => offer.id)),
    [favorites.data],
  );
  const appliedIds = useMemo(
    () =>
      new Set(
        (applications.data?.data ?? []).map(
          (application) => application.offer.id,
        ),
      ),
    [applications.data],
  );

  const toggleFavorite = useMutation({
    mutationFn: async ({ id, favorite }: { id: number; favorite: boolean }) => {
      if (favorite) await marketplaceApi.unfavorite(id, token as string);
      else await marketplaceApi.favorite(id, token as string);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-favorites"] }),
  });
  const apply = useMutation({
    mutationFn: (id: number) => marketplaceApi.apply(id, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }),
  });

  const applicationBlock = (offer: JobOffer): string | null => {
    if (!profile?.submitted_at) return content.business.submitProfile;
    if (offer.required_cefr_level) {
      const best = profile.languages.reduce(
        (rank, item) =>
          item.cefr_level ? Math.max(rank, CEFR_RANK[item.cefr_level]) : rank,
        -1,
      );
      if (best < CEFR_RANK[offer.required_cefr_level])
        return content.business.cefrRequired.replace(
          "{level}",
          offer.required_cefr_level,
        );
    }
    return null;
  };
  const applyError =
    apply.error instanceof ApiError
      ? apply.error.status === 409
        ? content.business.duplicate
        : content.business.failed
      : content.business.failed;

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      <header className="sticky top-0 z-40 flex min-h-16 items-center justify-between border-b border-outline-variant bg-surface px-2 shadow-subtle lg:px-4">
        <div className="flex items-center gap-3">
          <Link
            href="/dashboard"
            aria-label={content.header.backAria}
            className="flex h-11 w-11 items-center justify-center text-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </Link>
          <h1 className="text-lg font-extrabold text-primary">
            {content.header.title}
          </h1>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
        </div>
      </header>

      <main className="mx-auto max-w-6xl px-4 py-6 lg:px-10 lg:py-8">
        <div className="mb-6 flex flex-wrap gap-2">
          <Link
            href="/favoris"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline px-4 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined">favorite</span>
            {content.links.favorites}
          </Link>
          <Link
            href="/candidatures"
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-outline px-4 text-sm font-bold text-primary"
          >
            <span className="material-symbols-outlined">work_history</span>
            {content.links.applications}
          </Link>
        </div>

        <form
          className="mb-6 grid gap-3 rounded-2xl border border-outline-variant bg-surface-container-lowest p-4 md:grid-cols-2 lg:grid-cols-5"
          onSubmit={(event) => {
            event.preventDefault();
            setPage(1);
            setFilters(draft);
          }}
        >
          <label className="lg:col-span-2">
            <span className="sr-only">{content.search.srLabel}</span>
            <input
              value={draft.q ?? ""}
              onChange={(event) =>
                setDraft((value) => ({ ...value, q: event.target.value }))
              }
              placeholder={content.search.placeholder}
              className="min-h-11 w-full rounded-xl border border-outline bg-surface px-3 text-sm"
            />
          </label>
          <input
            value={draft.city ?? ""}
            onChange={(event) =>
              setDraft((value) => ({ ...value, city: event.target.value }))
            }
            placeholder={content.filters.city}
            aria-label={content.filters.city}
            className="min-h-11 rounded-xl border border-outline bg-surface px-3 text-sm"
          />
          <input
            value={draft.sector ?? ""}
            onChange={(event) =>
              setDraft((value) => ({ ...value, sector: event.target.value }))
            }
            placeholder={content.filters.sector}
            aria-label={content.filters.sector}
            className="min-h-11 rounded-xl border border-outline bg-surface px-3 text-sm"
          />
          <select
            value={draft.contract_type ?? ""}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                contract_type: (event.target.value || undefined) as
                  ContractType | undefined,
              }))
            }
            aria-label={content.filters.contract}
            className="min-h-11 rounded-xl border border-outline bg-surface px-3 text-sm"
          >
            <option value="">{content.filters.allContracts}</option>
            {CONTRACT_TYPES.map((type) => (
              <option key={type} value={type}>
                {content.contracts[type]}
              </option>
            ))}
          </select>
          <select
            value={draft.required_cefr_level ?? ""}
            onChange={(event) =>
              setDraft((value) => ({
                ...value,
                required_cefr_level: (event.target.value || undefined) as
                  CefrLevel | undefined,
              }))
            }
            aria-label={content.filters.cefr}
            className="min-h-11 rounded-xl border border-outline bg-surface px-3 text-sm"
          >
            <option value="">{content.filters.allLevels}</option>
            {CEFR_LEVELS.map((level) => (
              <option key={level} value={level}>
                {level}
              </option>
            ))}
          </select>
          <div className="flex gap-2 lg:col-span-4">
            <Button type="submit" size="sm">
              {content.filters.apply}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setDraft({});
                setFilters({});
                setPage(1);
              }}
            >
              {content.filters.reset}
            </Button>
          </div>
        </form>

        {offers.isLoading && (
          <p className="rounded-xl bg-surface-container p-4 text-center text-sm">
            {content.loading}
          </p>
        )}
        {offers.isError && (
          <p
            role="alert"
            className="rounded-xl bg-error/10 p-4 text-center text-sm text-error"
          >
            {content.error}
          </p>
        )}
        {!offers.isLoading && offers.data?.data.length === 0 && (
          <p className="rounded-xl bg-surface-container p-4 text-center text-sm">
            {content.job.noResults}
          </p>
        )}

        <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
          {offers.data?.data.map((offer) => {
            const favorite = favoriteIds.has(offer.id);
            const applied = appliedIds.has(offer.id);
            const blocked = applicationBlock(offer);
            return (
              <article
                key={offer.id}
                className="flex flex-col rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-5 shadow-subtle"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div>
                    <Link
                      href={`/offres/${offer.id}`}
                      className="font-extrabold hover:underline"
                    >
                      {offer.title}
                    </Link>
                    <p className="mt-1 text-xs text-onSurface-variant">
                      {offer.employer?.company_profile?.company_name ??
                        offer.sector}
                    </p>
                  </div>
                  <IconButton
                    variant="ghost"
                    size="sm"
                    onClick={() =>
                      toggleFavorite.mutate({ id: offer.id, favorite })
                    }
                    disabled={toggleFavorite.isPending}
                    aria-pressed={favorite}
                    aria-label={
                      favorite
                        ? content.job.removeFavoriteAria
                        : content.job.addFavoriteAria
                    }
                  >
                    <span
                      className={`material-symbols-outlined ${favorite ? "fill text-secondary-dark" : ""}`}
                    >
                      favorite
                    </span>
                  </IconButton>
                </div>
                <p className="text-sm text-onSurface-variant">
                  {offer.city}, {offer.country}
                </p>
                <p className="mt-1 text-sm font-bold">
                  {formatSalary(offer, language)}
                </p>
                <div className="my-4 flex flex-wrap gap-2">
                  <span className="rounded-md bg-surface-container-high px-2 py-1 text-xs">
                    {content.contracts[offer.contract_type]}
                  </span>
                  {offer.required_cefr_level && (
                    <span className="rounded-md bg-secondary/20 px-2 py-1 text-xs">
                      {content.job.cefr.replace(
                        "{level}",
                        offer.required_cefr_level,
                      )}
                    </span>
                  )}
                  {offer.match_score != null && (
                    <span className="rounded-md bg-primary/10 px-2 py-1 text-xs font-bold text-primary">
                      {content.job.match.replace(
                        "{value}",
                        String(offer.match_score),
                      )}
                    </span>
                  )}
                </div>
                <div className="mt-auto space-y-2">
                  <Link
                    href={`/offres/${offer.id}`}
                    className="inline-flex min-h-11 w-full items-center justify-center rounded-full border border-outline text-sm font-bold text-primary"
                  >
                    {content.job.details}
                  </Link>
                  <Button
                    fullWidth
                    size="sm"
                    variant={applied ? "tonal" : "secondary"}
                    disabled={applied || Boolean(blocked) || apply.isPending}
                    onClick={() => apply.mutate(offer.id)}
                  >
                    {applied
                      ? content.job.appliedButton
                      : content.job.interestedButton}
                  </Button>
                  {blocked && !applied && (
                    <p className="text-xs text-error">{blocked}</p>
                  )}
                </div>
              </article>
            );
          })}
        </div>
        {apply.isError && (
          <p role="alert" className="mt-4 text-sm text-error">
            {applyError}
          </p>
        )}
        <div className="mt-6">
          <Pagination
            page={page}
            data={offers.data}
            onPage={setPage}
            noun={content.pagination.noun}
            nounPlural={content.pagination.plural}
            language={language}
          />
        </div>
      </main>
    </div>
  );
}
