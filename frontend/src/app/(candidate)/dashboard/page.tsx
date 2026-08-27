"use client";

// Candidate dashboard: every personal value comes from the Laravel API.

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import { useProfile } from "@/context/ProfileContext";
import { useLanguage } from "@/context/LanguageContext";
import { useCandidateProfile } from "@/lib/useCandidateProfile";
import { useUnreadNotifications } from "@/lib/useUnreadNotifications";
import {
  marketplaceApi,
  type JobApplication,
} from "@/lib/candidateMarketplace";
import { languageAssessmentRepository } from "@/data/languageAssessment";
import { documentsRepository } from "@/data/documents";
import { ChecklistItem } from "@/components/shared/ChecklistItem";
import { Button } from "@/components/shared/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { candidateDashboardContentFor } from "@/lib/candidateDashboardContent";
import type { CefrLevel } from "@/lib/candidateProfile";

const QUICK_ACTIONS = [
  { href: "/documents", key: "addDocument", icon: "description" },
  { href: "/video", key: "recordVideo", icon: "videocam" },
  { href: "/test-langue", key: "languageTest", icon: "mic" },
  { href: "/profil", key: "publicProfile", icon: "account_circle" },
  { href: "/taches", key: "dailyTasks", icon: "task_alt" },
  { href: "/offres", key: "jobOffers", icon: "work" },
  { href: "/candidatures", key: "applications", icon: "work_history" },
  { href: "/favoris", key: "favorites", icon: "favorite" },
  { href: "/salaire", key: "salarySimulator", icon: "calculate" },
  { href: "/visibilite", key: "visibility", icon: "insights" },
  { href: "/parrainage", key: "referral", icon: "group_add" },
  {
    href: "/verification-identite",
    key: "verifyIdentity",
    icon: "verified_user",
  },
  { href: "/matching-preferences", key: "matchingPreferences", icon: "tune" },
] as const;

const STAGE_BY_STATUS: Record<JobApplication["status"], number> = {
  submitted: 0,
  viewed: 1,
  interview: 2,
  accepted: 3,
  rejected: 3,
  withdrawn: 0,
};
const CEFR_RANK: Record<CefrLevel, number> = {
  A1: 0,
  A2: 1,
  B1: 2,
  B2: 3,
  C1: 4,
  C2: 5,
};

export default function DashboardPage() {
  const { language } = useLanguage();
  const content = candidateDashboardContentFor(language);
  const { token } = useAuth();
  const { profile: localProfile } = useProfile();
  const { data: profile, isLoading } = useCandidateProfile();
  const { unreadCount } = useUnreadNotifications();
  const queryClient = useQueryClient();
  const [cvDone, setCvDone] = useState(false);
  const [diplomaDone, setDiplomaDone] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);

  const applications = useQuery({
    queryKey: ["candidate-applications", "dashboard"],
    queryFn: () => marketplaceApi.applications(token as string, 1, 100),
    enabled: Boolean(token),
  });
  const offers = useQuery({
    queryKey: ["offers", "dashboard", profile?.matching_preferences],
    queryFn: () => marketplaceApi.offers(token as string, { per_page: 12 }),
    enabled: Boolean(token),
  });
  const apply = useMutation({
    mutationFn: (id: number) => marketplaceApi.apply(id, token as string),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["candidate-applications"] });
    },
  });

  useEffect(() => {
    if (!token) return;
    documentsRepository
      .list(token)
      .then((documents) => {
        setCvDone(
          documents.some(
            (document) =>
              document.type === "cv" && document.ocr_status === "completed",
          ),
        );
        setDiplomaDone(
          documents.some(
            (document) =>
              document.type === "diploma" || document.type === "certificate",
          ),
        );
        setIdentityVerified(
          documents.some(
            (document) =>
              document.type === "identity" &&
              document.approval_status === "approved",
          ),
        );
      })
      .catch(() => undefined);
    languageAssessmentRepository
      .list(token)
      .then((assessments) =>
        setTestDone(
          assessments.some((assessment) => assessment.status === "completed"),
        ),
      )
      .catch(() => undefined);
  }, [token]);

  const appliedIds = useMemo(
    () =>
      new Set(
        (applications.data?.data ?? []).map(
          (application) => application.offer.id,
        ),
      ),
    [applications.data],
  );
  const recommendations = useMemo(
    () =>
      (offers.data?.data ?? [])
        .filter((offer) => offer.match_score != null && offer.match_score > 0)
        .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
        .slice(0, 3),
    [offers.data],
  );
  const bestCefr =
    profile?.languages.reduce(
      (rank, item) =>
        item.cefr_level ? Math.max(rank, CEFR_RANK[item.cefr_level]) : rank,
      -1,
    ) ?? -1;
  const heroApplication = applications.data?.data[0];
  const videoDone = Boolean(profile?.presentation_video_path);
  const percent = profile?.completeness.percent ?? 0;
  const personalDone =
    profile?.completeness.sections.find((section) => section.key === "personal")
      ?.complete ?? false;
  const educationDone =
    profile?.completeness.sections.find(
      (section) => section.key === "education",
    )?.complete ?? false;
  const languagesDone =
    profile?.completeness.sections.find(
      (section) => section.key === "languages",
    )?.complete ?? false;
  const firstName = profile?.first_name ?? localProfile.firstName;
  const avatarInitials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase() ||
    localProfile.avatarInitials;

  return (
    <div>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-2.5 py-1.5 backdrop-blur-md lg:px-4 lg:py-2">
        <div>
          <h1 className="text-base font-extrabold text-primary lg:text-xl">
            {content.header.greeting.replace(
              "{name}",
              firstName || content.header.fallbackName,
            )}{" "}
            {content.header.greetingEmoji}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">
            {content.header.spaceLabel}
          </p>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <Link
            href="/notifications"
            aria-label={content.header.notificationsAriaLabel}
            className="relative flex h-11 w-11 items-center justify-center rounded-full text-onSurface-variant hover:bg-surface-container"
          >
            <span
              className="material-symbols-outlined"
              style={{ fontSize: 22 }}
            >
              notifications
            </span>
            {unreadCount > 0 && (
              <span className="absolute right-1 top-1 min-w-4 rounded-full bg-error px-1 text-center text-[10px] font-bold text-onError">
                {unreadCount > 99 ? "99+" : unreadCount}
              </span>
            )}
          </Link>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-black text-onPrimary shadow-sm">
            {avatarInitials || "—"}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-6 pb-8 pt-4 lg:max-w-6xl lg:px-10 lg:pt-8">
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-6 lg:col-span-2">
            <section className="flex flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-subtle">
              <div className="mb-4 flex w-full items-center justify-between">
                <h2 className="text-sm font-extrabold">
                  {content.profileProgress.title}
                </h2>
                <span className="text-xs font-extrabold text-primary">
                  {percent}%
                </span>
              </div>
              <div
                className="relative mb-5 flex h-36 w-36 items-center justify-center rounded-full shadow-inner"
                style={{
                  background: `radial-gradient(closest-side, white 82%, transparent 83% 100%), conic-gradient(#006266 ${percent}%, #EDEEEF 0)`,
                }}
              >
                <span className="text-3xl font-black text-primary">
                  {percent}%
                </span>
              </div>
              <p className="px-2 text-xs font-medium leading-relaxed text-onSurface-variant">
                {content.profileProgress.description}
              </p>
            </section>

            <div className="flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 shadow-sm">
                <span
                  className="material-symbols-outlined fill text-primary"
                  style={{ fontSize: 16 }}
                >
                  {profile?.terms_consent_at && profile?.cndp_consent_at
                    ? "visibility"
                    : "visibility_off"}
                </span>
                <span className="text-xs font-medium">
                  {profile?.terms_consent_at && profile?.cndp_consent_at
                    ? content.visibility.visible
                    : content.visibility.hidden}
                </span>
              </div>
            </div>

            <section className="space-y-3">
              <h2 className="text-lg font-extrabold text-primary">
                {content.checklist.title}
              </h2>
              <div className="divide-y divide-surface-container-high overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle">
                <ChecklistItem
                  label={content.checklist.items.personal.label}
                  status={
                    isLoading ? "pending" : personalDone ? "done" : "pending"
                  }
                  href="/profile-creation?step=1"
                  actionLabel={
                    personalDone
                      ? undefined
                      : content.checklist.items.personal.action
                  }
                />
                <ChecklistItem
                  label={content.checklist.items.education.label}
                  status={
                    isLoading ? "pending" : educationDone ? "done" : "pending"
                  }
                  href="/profile-creation?step=3"
                  actionLabel={
                    educationDone
                      ? undefined
                      : content.checklist.items.education.action
                  }
                />
                <ChecklistItem
                  label={content.checklist.items.languages.label}
                  status={
                    isLoading ? "pending" : languagesDone ? "done" : "pending"
                  }
                  href="/profile-creation?step=4"
                  actionLabel={
                    languagesDone
                      ? undefined
                      : content.checklist.items.languages.action
                  }
                />
                <ChecklistItem
                  label={content.checklist.items.cv.label}
                  status={cvDone ? "done" : "pending"}
                  href="/documents"
                  actionLabel={content.checklist.items.cv.action}
                />
                <ChecklistItem
                  label={content.checklist.items.diploma.label}
                  status={diplomaDone ? "done" : "pending"}
                  href="/documents"
                  actionLabel={content.checklist.items.diploma.action}
                />
                <ChecklistItem
                  label={content.checklist.items.video.label}
                  status={videoDone ? "done" : "pending"}
                  href="/video"
                  actionLabel={content.checklist.items.video.action}
                />
                <ChecklistItem
                  label={content.checklist.items.test.label}
                  status={testDone ? "done" : "pending"}
                  href="/test-langue"
                  actionLabel={content.checklist.items.test.action}
                />
                <ChecklistItem
                  label={content.checklist.items.identity.label}
                  status={identityVerified ? "done" : "pending"}
                  href="/verification-identite"
                  actionLabel={content.checklist.items.identity.action}
                />
              </div>
            </section>
          </div>

          <section className="space-y-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-primary">
                {content.applications.title}
              </h2>
              <Link
                href="/candidatures"
                className="text-xs font-bold text-primary hover:underline"
              >
                {content.applications.viewAll}
              </Link>
            </div>
            {applications.isLoading && (
              <p className="rounded-xl bg-surface-container p-4 text-sm">
                {content.loading}
              </p>
            )}
            {!applications.isLoading && !heroApplication && (
              <p className="rounded-xl border border-outline-variant p-6 text-center text-sm text-onSurface-variant">
                {content.applications.empty}
              </p>
            )}
            {heroApplication && (
              <div className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
                <div className="mb-5 flex items-center justify-between gap-3">
                  <div>
                    <Link
                      href={`/offres/${heroApplication.offer.id}`}
                      className="text-sm font-extrabold hover:underline"
                    >
                      {heroApplication.offer.title}
                    </Link>
                    <p className="text-xs text-onSurface-variant">
                      {heroApplication.offer.city}
                    </p>
                  </div>
                  <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold text-tertiary">
                    {content.applications.statuses[heroApplication.status]}
                  </span>
                </div>
                <div className="relative pb-1 pt-2">
                  <div className="absolute left-[12%] right-[12%] top-[13px] h-0.5 bg-outline-variant" />
                  <div
                    className="absolute left-[12%] top-[13px] h-0.5 bg-primary"
                    style={{
                      width: `${(STAGE_BY_STATUS[heroApplication.status] / 3) * 76}%`,
                    }}
                  />
                  <div className="relative flex items-center justify-between">
                    {content.applications.stages.map((stage, index) => (
                      <div
                        key={stage}
                        className="flex flex-1 flex-col items-center gap-1.5 text-center"
                      >
                        <span
                          className={`h-3.5 w-3.5 rounded-full ring-4 ring-surface-container-lowest ${index <= STAGE_BY_STATUS[heroApplication.status] ? "bg-primary" : "border border-outline-variant bg-surface-container-high"}`}
                        />
                        <span className="text-[10px] font-medium text-onSurface-variant">
                          {stage}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
                <p className="mt-3 text-right text-[10px] text-onSurface-variant">
                  {content.applications.updatedOn.replace(
                    "{date}",
                    new Date(
                      heroApplication.status_changed_at,
                    ).toLocaleDateString(language),
                  )}
                </p>
              </div>
            )}
            {applications.data?.data.slice(1, 4).map((application) => (
              <Link
                key={application.id}
                href={`/offres/${application.offer.id}`}
                className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle"
              >
                <div>
                  <h3 className="text-sm font-bold">
                    {application.offer.title}
                  </h3>
                  <p className="text-xs text-onSurface-variant">
                    {application.offer.city}
                  </p>
                </div>
                <span className="text-xs font-bold">
                  {content.applications.statuses[application.status]}
                </span>
              </Link>
            ))}
          </section>
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <section className="space-y-3 lg:col-span-3">
            <h2 className="text-lg font-extrabold text-primary">
              {content.quickActions.title}
            </h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex min-h-28 flex-col items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle hover:border-primary/50"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-pillar bg-surface-container-low text-primary">
                    <span
                      className="material-symbols-outlined"
                      style={{ fontSize: 26 }}
                    >
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-xs font-bold">
                    {content.quickActions.items[action.key]}
                  </span>
                </Link>
              ))}
            </div>
          </section>

          <section className="space-y-3 lg:col-span-2">
            <h2 className="text-lg font-extrabold text-primary">
              {content.recommendations.title}
            </h2>
            {!offers.isLoading && recommendations.length === 0 && (
              <p className="rounded-xl border border-outline-variant p-6 text-center text-sm text-onSurface-variant">
                {content.recommendations.empty}
              </p>
            )}
            {recommendations.map((offer) => {
              const applied = appliedIds.has(offer.id);
              const eligible =
                Boolean(profile?.submitted_at) &&
                (!offer.required_cefr_level ||
                  bestCefr >= CEFR_RANK[offer.required_cefr_level]);
              return (
                <div
                  key={offer.id}
                  className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle"
                >
                  <div className="mb-3 flex items-start justify-between gap-3">
                    <Link
                      href={`/offres/${offer.id}`}
                      className="text-sm font-extrabold hover:underline"
                    >
                      {offer.title}
                    </Link>
                    {offer.match_score != null && (
                      <span className="shrink-0 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                        {content.recommendations.matchBadge.replace(
                          "{value}",
                          String(offer.match_score),
                        )}
                      </span>
                    )}
                  </div>
                  <p className="mb-3 text-xs text-onSurface-variant">
                    {offer.city}, {offer.country} · {offer.contract_type}
                  </p>
                  {eligible || applied ? (
                    <Button
                      variant={applied ? "tonal" : "primary"}
                      size="sm"
                      fullWidth
                      disabled={applied || apply.isPending}
                      onClick={() => apply.mutate(offer.id)}
                    >
                      {applied
                        ? content.recommendations.appliedButton
                        : content.recommendations.applyButton}
                    </Button>
                  ) : (
                    <Link
                      href={`/offres/${offer.id}`}
                      className="inline-flex min-h-10 w-full items-center justify-center rounded-full border border-outline text-xs font-bold text-primary"
                    >
                      {content.recommendations.viewDetails}
                    </Link>
                  )}
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}
