"use client";

// Full offer detail: candidates can read the role before applying or saving it.

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/shared/Button";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidateProfile } from "@/lib/useCandidateProfile";
import { marketplaceApi } from "@/lib/candidateMarketplace";
import { candidateOffresContentFor } from "@/lib/candidateOffresContent";
import type { CefrLevel } from "@/lib/candidateProfile";
import { ApiError } from "@/lib/api";

const CEFR_RANK: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export default function OfferDetailPage() {
  const params = useParams<{ id: string }>();
  const offerId = Number(params.id);
  const { token } = useAuth();
  const { language } = useLanguage();
  const content = candidateOffresContentFor(language);
  const { data: profile } = useCandidateProfile();
  const queryClient = useQueryClient();
  const offer = useQuery({
    queryKey: ["offer", offerId],
    queryFn: () => marketplaceApi.offer(offerId, token as string),
    enabled: Boolean(token) && Number.isInteger(offerId),
    retry: (count, error) =>
      !(error instanceof ApiError && error.status === 404) && count < 2,
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
  const favorite = useMemo(
    () => favorites.data?.data.some((item) => item.id === offerId) ?? false,
    [favorites.data, offerId],
  );
  const applied = useMemo(
    () =>
      applications.data?.data.some((item) => item.offer.id === offerId) ??
      false,
    [applications.data, offerId],
  );
  const toggleFavorite = useMutation({
    mutationFn: async () => {
      if (favorite) await marketplaceApi.unfavorite(offerId, token as string);
      else await marketplaceApi.favorite(offerId, token as string);
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-favorites"] }),
  });
  const apply = useMutation({
    mutationFn: () => marketplaceApi.apply(offerId, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }),
  });

  const requiredLevel = offer.data?.required_cefr_level;
  const bestLevel =
    profile?.languages.reduce(
      (rank, item) =>
        item.cefr_level ? Math.max(rank, CEFR_RANK[item.cefr_level]) : rank,
      -1,
    ) ?? -1;
  const blocked = !profile?.submitted_at
    ? content.business.submitProfile
    : requiredLevel && bestLevel < CEFR_RANK[requiredLevel]
      ? content.business.cefrRequired.replace("{level}", requiredLevel)
      : null;

  if (offer.isLoading)
    return <p className="p-8 text-center">{content.loading}</p>;
  if (offer.isError || !offer.data) {
    return (
      <main className="mx-auto max-w-2xl p-8 text-center">
        <p className="rounded-xl border border-outline-variant p-8">
          {content.detail.notFound}
        </p>
        <Link
          href="/offres"
          className="mt-4 inline-block font-bold text-primary"
        >
          {content.detail.back}
        </Link>
      </main>
    );
  }

  const data = offer.data;
  const salary =
    data.salary_min == null && data.salary_max == null
      ? "—"
      : `${data.salary_min?.toLocaleString(language) ?? ""}${data.salary_min != null && data.salary_max != null ? " – " : ""}${data.salary_max?.toLocaleString(language) ?? ""} ${data.currency}`;

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex min-h-16 items-center gap-3 border-b border-outline-variant px-4">
        <Link
          href="/offres"
          aria-label={content.detail.back}
          className="flex h-11 w-11 items-center justify-center"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="font-bold text-primary">{data.title}</h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-6 p-6">
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h2 className="text-2xl font-extrabold text-primary">
                {data.title}
              </h2>
              <p className="mt-1 text-onSurface-variant">
                {data.employer?.company_profile?.company_name ?? data.sector}
              </p>
            </div>
            {data.match_score != null && (
              <span className="rounded-full bg-primary/10 px-3 py-1 text-sm font-bold text-primary">
                {content.job.match.replace("{value}", String(data.match_score))}
              </span>
            )}
          </div>
          <dl className="mt-6 grid gap-4 sm:grid-cols-2">
            <div>
              <dt className="text-xs font-bold uppercase text-outline">
                {content.detail.location}
              </dt>
              <dd>
                {data.city}, {data.country}
              </dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-outline">
                {content.detail.contract}
              </dt>
              <dd>{content.contracts[data.contract_type]}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-outline">
                {content.detail.salary}
              </dt>
              <dd>{salary}</dd>
            </div>
            <div>
              <dt className="text-xs font-bold uppercase text-outline">
                {content.detail.level}
              </dt>
              <dd>{data.required_cefr_level ?? "—"}</dd>
            </div>
          </dl>
        </section>
        <section className="rounded-2xl border border-outline-variant bg-surface-container-lowest p-6 shadow-subtle">
          <h2 className="text-lg font-extrabold text-primary">
            {content.detail.description}
          </h2>
          <p className="mt-4 whitespace-pre-wrap leading-relaxed text-onSurface-variant">
            {data.description}
          </p>
        </section>
        <div className="flex flex-col gap-3 sm:flex-row">
          <Button
            variant="outline"
            className="flex-1"
            disabled={toggleFavorite.isPending}
            onClick={() => toggleFavorite.mutate()}
          >
            {favorite ? content.detail.unfavorite : content.detail.favorite}
          </Button>
          <Button
            className="flex-1"
            disabled={applied || Boolean(blocked) || apply.isPending}
            onClick={() => apply.mutate()}
          >
            {applied ? content.job.appliedButton : content.job.interestedButton}
          </Button>
        </div>
        {blocked && !applied && (
          <p role="status" className="text-sm text-error">
            {blocked}
          </p>
        )}
        {apply.isError && (
          <p role="alert" className="text-sm text-error">
            {content.business.failed}
          </p>
        )}
      </main>
    </div>
  );
}
