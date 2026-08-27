"use client";

// Localized notification inbox. New rows render from type/payload; old rows
// retain their stored title/body as a safe fallback.

import { useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/shared/Button";
import { Pagination } from "@/components/Pagination";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import {
  marketplaceApi,
  type CandidateNotification,
} from "@/lib/candidateMarketplace";
import { candidateNotificationsContentFor } from "@/lib/candidateNotificationsContent";
import { candidateCandidaturesContentFor } from "@/lib/candidateCandidaturesContent";
import {
  CANDIDATE_NOTIFICATIONS_QUERY_KEY,
  useUnreadNotifications,
} from "@/lib/useUnreadNotifications";

function interpolate(
  template: string,
  payload: Record<string, unknown>,
): string {
  return Object.entries(payload)
    .reduce(
      (text, [key, value]) =>
        text.replaceAll(`{${key}}`, value == null ? "" : String(value)),
      template,
    )
    .replace(/\s+([.,])/g, "$1")
    .trim();
}

export default function NotificationsPage() {
  const { token } = useAuth();
  const { language } = useLanguage();
  const content = candidateNotificationsContentFor(language);
  const applicationContent = candidateCandidaturesContentFor(language);
  const queryClient = useQueryClient();
  const [page, setPage] = useState(1);
  const firstPage = useUnreadNotifications();
  const otherPage = useQuery({
    queryKey: [...CANDIDATE_NOTIFICATIONS_QUERY_KEY, page],
    queryFn: () => marketplaceApi.notifications(token as string, page),
    enabled: Boolean(token) && page > 1,
  });
  const query = page === 1 ? firstPage : otherPage;
  const refresh = () =>
    queryClient.invalidateQueries({
      queryKey: CANDIDATE_NOTIFICATIONS_QUERY_KEY,
    });
  const read = useMutation({
    mutationFn: (id: number) =>
      marketplaceApi.readNotification(id, token as string),
    onSuccess: refresh,
  });
  const readAll = useMutation({
    mutationFn: () => marketplaceApi.readAllNotifications(token as string),
    onSuccess: refresh,
  });

  const translated = (notification: CandidateNotification) => {
    const template = (
      content.types as Record<string, { title: string; body: string }>
    )[notification.type];
    if (!template || !notification.payload)
      return { title: notification.title, body: notification.body };
    const payload = { ...notification.payload };
    if (
      typeof payload.status === "string" &&
      payload.status in applicationContent.statuses
    ) {
      payload.status =
        applicationContent.statuses[
          payload.status as keyof typeof applicationContent.statuses
        ];
    }
    return { title: template.title, body: interpolate(template.body, payload) };
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="flex min-h-16 items-center gap-3 border-b border-outline-variant px-4 py-2">
        <Link href="/dashboard" aria-label={content.backAria}>
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <h1 className="flex-1 font-bold text-primary">{content.title}</h1>
        <Button
          variant="link"
          size="sm"
          disabled={readAll.isPending || firstPage.unreadCount === 0}
          onClick={() => readAll.mutate()}
        >
          {content.readAll}
        </Button>
      </header>
      <main className="mx-auto max-w-3xl p-6">
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
        <div className="divide-y divide-outline-variant">
          {query.data?.data.map((notification) => {
            const text = translated(notification);
            return (
              <article
                key={notification.id}
                className={`p-4 ${notification.read_at ? "opacity-70" : "bg-primary/5"}`}
              >
                <div className="flex justify-between gap-3">
                  <div>
                    <h2 className="font-bold">{text.title}</h2>
                    <p className="mt-1 text-sm text-onSurface-variant">
                      {text.body}
                    </p>
                    <time className="mt-2 block text-xs">
                      {new Date(notification.created_at).toLocaleString(
                        language,
                      )}
                    </time>
                  </div>
                  {!notification.read_at && (
                    <button
                      className="min-h-11 min-w-11"
                      onClick={() => read.mutate(notification.id)}
                      aria-label={content.markReadAria}
                    >
                      <span className="material-symbols-outlined text-primary">
                        done
                      </span>
                    </button>
                  )}
                </div>
                {notification.link && (
                  <Link
                    href={notification.link}
                    className="mt-2 inline-block text-sm font-bold text-primary"
                  >
                    {content.open}
                  </Link>
                )}
              </article>
            );
          })}
        </div>
        <div className="mt-5">
          <Pagination
            page={page}
            data={query.data}
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
