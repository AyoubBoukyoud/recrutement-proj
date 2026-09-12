"use client";

// Candidate favorites with server pagination and localized empty/error states.

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/shared/Button";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { marketplaceApi } from "@/lib/candidateMarketplace";
import { candidateFavorisContentFor } from "@/lib/candidateFavorisContent";

export default function FavoritesPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const content = candidateFavorisContentFor(language);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["candidate-favorites", page],
    queryFn: () => marketplaceApi.favorites(token as string, page),
    enabled: Boolean(token),
  });
  const remove = useMutation({
    mutationFn: (id: number) => marketplaceApi.unfavorite(id, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-favorites"] }),
  });

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 items-center gap-3 border-b border-outline-variant px-4">
        <Link href="/offres" aria-label={content.backAria}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary">{content.title}</h1>
      </header>
      <main className="mx-auto max-w-3xl space-y-4 p-6">
        {query.isLoading && <p>{content.loading}</p>}
        {query.isError && (
          <p role="alert" className="text-error">
            {content.error}
          </p>
        )}
        {query.data?.data.length === 0 && (
          <p className="rounded-xl border border-outline-variant p-8 text-center">
            {content.empty}
          </p>
        )}
        {query.data?.data.map((offer) => (
          <article
            key={offer.id}
            className="rounded-xl border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle"
          >
            <Link
              href={`/offres/${offer.id}`}
              className="font-bold text-primary hover:underline"
            >
              {offer.title}
            </Link>
            <p className="mt-1 text-sm text-onSurface-variant">
              {offer.city} · {offer.sector}
            </p>
            <div className="mt-3 flex flex-wrap gap-2">
              <Link
                href={`/offres/${offer.id}`}
                className="inline-flex h-10 items-center rounded-full border border-outline px-4 text-xs font-bold text-primary"
              >
                {content.open}
              </Link>
              <Button
                variant="destructive-ghost"
                size="sm"
                disabled={remove.isPending}
                onClick={() => remove.mutate(offer.id)}
              >
                {content.remove}
              </Button>
            </div>
          </article>
        ))}
        <Pagination
          page={page}
          data={query.data}
          onPage={setPage}
          noun={content.pagination.noun}
          nounPlural={content.pagination.plural}
          language={language}
        />
      </main>
    </div>
  );
}
