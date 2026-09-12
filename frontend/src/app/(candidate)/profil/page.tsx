"use client";

// Interface 15 — Profil public candidat (aperçu + édition).

import { useEffect, useState } from "react";
import Link from "next/link";
import { Button, IconButton } from "@/components/shared/Button";
import { LanguageSwitcher } from "@/components/shared/LanguageSwitcher";
import { ThemeToggle } from "@/components/shared/ThemeToggle";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { useLanguage } from "@/context/LanguageContext";
import { profilContentFor } from "@/lib/candidateProfilContent";
import {
  useCandidateProfile,
  useInvalidateCandidateProfile,
} from "@/lib/useCandidateProfile";
import { candidateProfileRepository } from "@/data/candidateProfile";
import {
  createSkill,
  deleteSkill,
  getProfileTimeline,
  LANGUAGE_LABELS,
  AVAILABILITY_LABELS,
  type TimelineMilestone,
} from "@/lib/candidateProfile";
import { documentsRepository } from "@/data/documents";
import {
  toLocalEntry,
  fileNameOf,
  type CandidateDocument,
} from "@/lib/documents";
import { CEFRGauge } from "@/components/shared/CEFRGauge";
import { DocumentViewer } from "@/components/shared/DocumentViewer";
import { VideoPlayer } from "@/components/shared/VideoPlayer";
import { QRCodeGenerator } from "@/components/shared/QRCodeGenerator";
import { Timeline } from "@/components/shared/Timeline";
import { SkeletonLoader } from "@/components/shared/SkeletonLoader";
import type { TimelineStep } from "@/lib/types";

// Métadonnées fixes des raccourcis "Outils & Certifications" — alignées
// positionnellement avec `content.tools` (même ordre dans les 4 traductions).
const TOOLS_META: { href: string; icon: string }[] = [
  { href: "/visibilite", icon: "insights" },
  { href: "/verification-identite", icon: "verified_user" },
  { href: "/parrainage", icon: "group_add" },
  { href: "/matching-preferences", icon: "tune" },
  { href: "/salaire", icon: "payments" },
  { href: "/quiz-metier", icon: "quiz" },
  { href: "/taches", icon: "task_alt" },
  { href: "/candidatures", icon: "work_history" },
  { href: "/favoris", icon: "favorite" },
];

/** Le premier jalon sans date est « en cours » ; tout ce qui suit est « à venir ». */
function toTimelineSteps(milestones: TimelineMilestone[]): TimelineStep[] {
  const firstUnreachedIndex = milestones.findIndex((m) => !m.completed_at);

  return milestones.map((m, index) => ({
    id: m.key,
    label: m.label,
    description: "",
    date: m.completed_at,
    status:
      m.completed_at != null
        ? "termine"
        : index === firstUnreachedIndex
          ? "en_cours"
          : "a_venir",
  }));
}

export default function ProfilPage() {
  const router = useRouter();
  const { token, logout } = useAuth();
  const { language } = useLanguage();
  const content = profilContentFor(language);
  const { data: profile, isLoading } = useCandidateProfile();
  const invalidateProfile = useInvalidateCandidateProfile();

  const [timeline, setTimeline] = useState<TimelineStep[]>([]);
  const [documents, setDocuments] = useState<CandidateDocument[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [form, setForm] = useState({ profession: "", specialization: "" });
  const [isSaving, setIsSaving] = useState(false);
  const [newSkill, setNewSkill] = useState("");
  const [skillsSaving, setSkillsSaving] = useState(false);

  useEffect(() => {
    if (!token) return;
    let cancelled = false;

    getProfileTimeline(token)
      .then((milestones) => {
        if (!cancelled) setTimeline(toTimelineSteps(milestones));
      })
      .catch(() => {
        if (!cancelled) setTimeline([]);
      });

    documentsRepository
      .list(token)
      .then((docs) => {
        if (!cancelled) setDocuments(docs);
      })
      .catch(() => {
        if (!cancelled) setDocuments([]);
      });

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (profile)
      setForm({
        profession: profile.profession ?? "",
        specialization: profile.specialization ?? "",
      });
  }, [profile]);

  const handleLogout = () => {
    logout();
    router.replace("/auth-phone");
  };

  const handleSave = async () => {
    if (!token) return;
    setIsSaving(true);
    try {
      await candidateProfileRepository.update(
        {
          profession: form.profession || null,
          specialization: form.specialization || null,
        },
        token,
      );
      await invalidateProfile();
      setIsEditing(false);
    } finally {
      setIsSaving(false);
    }
  };

  const addSkill = async () => {
    if (!token || !newSkill.trim()) return;
    setSkillsSaving(true);
    try {
      await createSkill(newSkill.trim(), token);
      setNewSkill("");
      await invalidateProfile();
    } finally {
      setSkillsSaving(false);
    }
  };

  const removeSkill = async (id: number) => {
    if (!token) return;
    setSkillsSaving(true);
    try {
      await deleteSkill(id, token);
      await invalidateProfile();
    } finally {
      setSkillsSaving(false);
    }
  };

  const avatarInitials =
    `${profile?.first_name?.[0] ?? ""}${profile?.last_name?.[0] ?? ""}`.toUpperCase();
  const shareUrl = `https://amudskills.app/p/${avatarInitials || "candidat"}`;

  return (
    <div className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-2.5 py-1.5 backdrop-blur-md lg:px-4">
        <Link
          href="/dashboard"
          aria-label={content.header.backAriaLabel}
          className="flex items-center text-primary hover:opacity-80 transition-opacity"
        >
          <span
            className="material-symbols-outlined text-primary"
            style={{ fontSize: 22 }}
          >
            arrow_back
          </span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">
          {content.header.title}
        </h1>
        <div className="flex items-center gap-1">
          <Link
            href="/compte"
            aria-label="Mon compte"
            className="flex h-10 w-10 items-center justify-center rounded-full text-primary hover:bg-surface-container"
          >
            <span className="material-symbols-outlined">manage_accounts</span>
          </Link>
          <LanguageSwitcher compact />
          <ThemeToggle />
          <IconButton
            variant="ghost"
            onClick={() => setShowQr((v) => !v)}
            aria-label={content.header.shareAriaLabel}
            className="text-primary"
          >
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 22 }}
            >
              ios_share
            </span>
          </IconButton>
        </div>
      </header>

      {isLoading ? (
        <main className="mx-auto max-w-xl px-6 pt-6">
          <p className="helper-text">{content.loading}</p>
        </main>
      ) : (
        <main className="mx-auto max-w-xl space-y-6 px-6 pt-6 lg:max-w-6xl lg:px-10 lg:pt-8">
          <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
            <div className="space-y-6 lg:col-span-2">
              <section className="flex flex-col items-center gap-3 text-center">
                <div className="relative">
                  <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-surface-lowest bg-primary-light text-4xl font-bold text-primary shadow-lg">
                    {avatarInitials || "?"}
                  </div>
                  <div className="absolute bottom-1 right-1 h-7 w-7 rounded-full border-4 border-surface-lowest bg-primary" />
                </div>
                <div className="space-y-1">
                  <h2 className="text-3xl font-extrabold tracking-tight text-primary">
                    {profile?.first_name || content.fallbackName}
                  </h2>
                  {profile?.availability_status && (
                    <div className="mt-2 inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-onPrimary-container">
                      {AVAILABILITY_LABELS[profile.availability_status]}
                    </div>
                  )}
                </div>
              </section>

              <section className="flex items-start gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light/60 text-primary">
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 24 }}
                  >
                    work
                  </span>
                </div>
                {isEditing ? (
                  <div className="flex-1 space-y-2">
                    <label htmlFor="profil-profession" className="sr-only">
                      {content.professionCard.professionSrLabel}
                    </label>
                    <input
                      id="profil-profession"
                      value={form.profession}
                      onChange={(e) =>
                        setForm((p) => ({ ...p, profession: e.target.value }))
                      }
                      placeholder={content.professionCard.professionPlaceholder}
                      className="w-full rounded-lg border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                    <label htmlFor="profil-specialization" className="sr-only">
                      {content.professionCard.specializationSrLabel}
                    </label>
                    <input
                      id="profil-specialization"
                      value={form.specialization}
                      onChange={(e) =>
                        setForm((p) => ({
                          ...p,
                          specialization: e.target.value,
                        }))
                      }
                      placeholder={
                        content.professionCard.specializationPlaceholder
                      }
                      className="w-full rounded-lg border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                    />
                  </div>
                ) : (
                  <div className="flex-1">
                    <h3 className="text-lg font-bold text-primary">
                      {profile?.specialization ||
                        content.professionCard.specializationFallback}
                    </h3>
                    <p className="text-sm text-onSurface-variant">
                      {profile?.profession || "—"}
                      {profile?.years_of_experience != null
                        ? ` · ${profile.years_of_experience}${content.professionCard.yearsExperienceSuffix}`
                        : ""}
                    </p>
                  </div>
                )}
                <Button
                  variant="link"
                  size="sm"
                  onClick={() =>
                    isEditing ? void handleSave() : setIsEditing(true)
                  }
                  disabled={isSaving}
                  className="shrink-0 gap-1 font-semibold"
                >
                  <span
                    className="material-symbols-outlined"
                    style={{ fontSize: 14 }}
                  >
                    {isEditing ? "check" : "edit"}
                  </span>
                  {isEditing
                    ? content.professionCard.save
                    : content.professionCard.edit}
                </Button>
              </section>
            </div>

            <div className="space-y-6 lg:col-span-3">
              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.languagesTitle}
                </h3>
                {!profile || profile.languages.length === 0 ? (
                  <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
                    {content.sections.languagesEmpty}
                  </p>
                ) : (
                  <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
                    {profile.languages.map((lang) => (
                      <div
                        key={lang.language}
                        className="min-w-[220px] space-y-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft"
                      >
                        <div className="flex items-start justify-between">
                          <span className="text-lg font-bold text-primary">
                            {LANGUAGE_LABELS[lang.language]}
                          </span>
                          {lang.cefr_level && (
                            <span className="rounded bg-primary-light px-2 py-0.5 text-xs font-bold text-onPrimary-container">
                              {lang.cefr_level}
                            </span>
                          )}
                        </div>
                        <CEFRGauge level={lang.cefr_level} />
                      </div>
                    ))}
                  </div>
                )}
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.skillsTitle}
                </h3>
                <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
                  <div className="flex flex-wrap gap-2">
                    {profile?.skills.map((skill) => (
                      <span
                        key={skill.id}
                        className="inline-flex min-h-11 items-center gap-1 rounded-full bg-primary/10 px-3 text-sm font-bold text-primary"
                      >
                        {skill.skill}
                        <button
                          type="button"
                          disabled={skillsSaving}
                          onClick={() => removeSkill(skill.id)}
                          aria-label={content.skills.removeAria.replace(
                            "{skill}",
                            skill.skill,
                          )}
                          className="flex h-8 w-8 items-center justify-center rounded-full"
                        >
                          <span
                            className="material-symbols-outlined"
                            style={{ fontSize: 16 }}
                          >
                            close
                          </span>
                        </button>
                      </span>
                    ))}
                    {profile?.skills.length === 0 && (
                      <p className="text-sm text-onSurface-variant">
                        {content.skills.empty}
                      </p>
                    )}
                  </div>
                  <div className="mt-3 flex gap-2">
                    <input
                      value={newSkill}
                      onChange={(event) => setNewSkill(event.target.value)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter") {
                          event.preventDefault();
                          void addSkill();
                        }
                      }}
                      placeholder={content.skills.placeholder}
                      className="min-h-11 flex-1 rounded-lg border border-outline px-3 text-sm"
                    />
                    <Button
                      size="sm"
                      disabled={!newSkill.trim() || skillsSaving}
                      onClick={addSkill}
                    >
                      {content.skills.add}
                    </Button>
                  </div>
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.presentationTitle}
                </h3>
                <VideoPlayer src={profile?.video_url ?? null} />
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.timelineTitle}
                </h3>
                <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
                  {timeline.length > 0 ? (
                    <Timeline steps={timeline.slice(0, 2)} />
                  ) : (
                    <SkeletonLoader variant="card" />
                  )}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.toolsTitle}
                </h3>
                <div className="grid grid-cols-1 gap-2.5">
                  {TOOLS_META.map((item, i) => (
                    <Link
                      key={item.href}
                      href={item.href}
                      className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
                    >
                      <div className="flex items-center gap-3">
                        <span
                          className="material-symbols-outlined text-primary"
                          style={{ fontSize: 20 }}
                        >
                          {item.icon}
                        </span>
                        <span className="text-xs font-bold text-onSurface">
                          {content.tools[i]?.label}
                        </span>
                      </div>
                      <span
                        className="material-symbols-outlined text-outline"
                        style={{ fontSize: 18 }}
                      >
                        chevron_right
                      </span>
                    </Link>
                  ))}
                </div>
              </section>

              <section className="space-y-3">
                <h3 className="px-1 text-lg font-bold text-primary">
                  {content.sections.documentsTitle} ({documents.length})
                </h3>
                <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
                  {documents.length === 0 ? (
                    <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant lg:col-span-2">
                      {content.sections.documentsEmpty}
                    </p>
                  ) : (
                    documents.map((doc) => (
                      <DocumentViewer
                        key={doc.id}
                        document={toLocalEntry(doc, fileNameOf(doc))}
                        previewUrl={doc.url}
                      />
                    ))
                  )}
                </div>
              </section>
            </div>
          </div>

          <section>
            <Button
              variant="destructive-ghost"
              fullWidth
              onClick={handleLogout}
              className="border-error/20 bg-surface-container-lowest shadow-subtle lg:mx-auto lg:max-w-sm"
            >
              <span
                className="material-symbols-outlined"
                style={{ fontSize: 20 }}
              >
                logout
              </span>
              {content.logout}
            </Button>
          </section>
        </main>
      )}

      {showQr && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface p-6">
          <IconButton
            variant="ghost"
            onClick={() => setShowQr(false)}
            aria-label={content.qr.closeAriaLabel}
            className="absolute right-6 top-6 text-primary"
          >
            <span
              className="material-symbols-outlined text-primary"
              style={{ fontSize: 28 }}
            >
              close
            </span>
          </IconButton>
          <h2 className="text-lg font-bold text-primary">{content.qr.title}</h2>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-lowest p-6 shadow-lg">
            <QRCodeGenerator value={shareUrl} size={220} />
            <span className="text-xs font-bold text-primary">
              {content.qr.scanMe}
            </span>
          </div>
        </div>
      )}
    </div>
  );
}
