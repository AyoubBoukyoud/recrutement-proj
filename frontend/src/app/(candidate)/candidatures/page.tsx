"use client";

// Candidate application history, backed by the paginated marketplace API.

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { CandidateApplicationCard } from "@/components/shared/CandidateApplicationCard";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { marketplaceApi } from "@/lib/candidateMarketplace";
import { candidateCandidaturesContentFor } from "@/lib/candidateCandidaturesContent";

export default function ApplicationsPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const content = candidateCandidaturesContentFor(language);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ["candidate-applications", page],
    queryFn: () => marketplaceApi.applications(token as string, page),
    enabled: Boolean(token),
  });
  const withdraw = useMutation({
    mutationFn: (id: number) =>
      marketplaceApi.withdrawApplication(id, token as string),
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["candidate-applications"] }),
  });

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex h-16 items-center gap-3 border-b border-outline-variant px-4">
        <Link href="/dashboard" aria-label={content.backAria}>
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
          <p className="rounded-xl border border-outline-variant p-8 text-center text-onSurface-variant">
            {content.empty}
          </p>
        )}
        {query.data?.data.map((application) => (
          <CandidateApplicationCard
            key={application.id}
            application={application}
            statusLabel={content.statuses[application.status]}
            withdrawLabel={content.withdraw}
            withdrawing={withdraw.isPending}
            locale={language}
            onWithdraw={() => withdraw.mutate(application.id)}
          />
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
