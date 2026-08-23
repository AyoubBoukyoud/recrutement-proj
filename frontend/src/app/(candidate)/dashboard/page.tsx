'use client';

// Interface 10 — Tableau de bord candidat.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useAuth } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useCandidateProfile } from '@/lib/useCandidateProfile';
import { listLanguageAssessments } from '@/lib/languageAssessment';
import { documentsRepository } from '@/data/documents';
import { ChecklistItem } from '@/components/shared/ChecklistItem';
import { Button, IconButton } from '@/components/shared/Button';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useLanguage } from '@/context/LanguageContext';
import { candidateDashboardContentFor } from '@/lib/candidateDashboardContent';

const QUICK_ACTIONS = [
  { href: '/documents', key: 'addDocument', icon: 'description' },
  { href: '/video', key: 'recordVideo', icon: 'videocam' },
  { href: '/test-langue', key: 'languageTest', icon: 'mic' },
  { href: '/profil', key: 'publicProfile', icon: 'account_circle' },
  { href: '/lecon-jour', key: 'germanLesson', icon: 'translate' },
  { href: '/offres', key: 'jobOffers', icon: 'work' },
  { href: '/salaire', key: 'salarySimulator', icon: 'calculate' },
  { href: '/visibilite', key: 'visibility', icon: 'insights' },
  { href: '/parrainage', key: 'referral', icon: 'group_add' },
  { href: '/verification-identite', key: 'verifyIdentity', icon: 'verified_user' },
  { href: '/matching-preferences', key: 'matchingPreferences', icon: 'tune' },
] as const;

const APPLICATIONS = [
  { id: 1, company: 'Klinik Berlin', icon: 'medical_services', stage: 2 },
  { id: 2, company: 'Elektro GmbH', icon: 'bolt', stage: 1 },
  { id: 3, company: 'Logistik Nord', icon: 'local_shipping', stage: 0 },
] as const;

const RECOMMENDATIONS = [
  { id: 1, company: 'Hôtel München', icon: 'hotel', match: 92 },
  { id: 2, company: 'Pflegeheim Hamburg', icon: 'medical_services', match: 87 },
] as const;

export default function DashboardPage() {
  // Vérification d'identité reste sur l'écran dédié (son propre document
  // approuvé fait foi) — ce tableau de bord ne la refait pas ici.
  const { language } = useLanguage();
  const content = candidateDashboardContentFor(language);
  const { token } = useAuth();
  const { profile: localProfile } = useProfile();
  const { data: profile, isLoading } = useCandidateProfile();
  const [cvDone, setCvDone] = useState(false);
  const [diplomaDone, setDiplomaDone] = useState(false);
  const [testDone, setTestDone] = useState(false);
  const [identityVerified, setIdentityVerified] = useState(false);

  useEffect(() => {
    if (!token) return;
    documentsRepository
      .list(token)
      .then((docs) => {
        setCvDone(docs.some((d) => d.type === 'cv' && d.ocr_status === 'completed'));
        setDiplomaDone(docs.some((d) => d.type === 'diploma' || d.type === 'certificate'));
        setIdentityVerified(docs.some((d) => d.type === 'identity' && d.approval_status === 'approved'));
      })
      .catch(() => undefined);
    listLanguageAssessments(token)
      .then((assessments) => setTestDone(assessments.some((a) => a.status === 'completed')))
      .catch(() => undefined);
  }, [token]);

  const videoDone = Boolean(profile?.presentation_video_path);
  const percent = profile?.completeness.percent ?? 0;
  const personalDone = profile?.completeness.sections.find((s) => s.key === 'personal')?.complete ?? false;
  const educationDone = profile?.completeness.sections.find((s) => s.key === 'education')?.complete ?? false;
  const languagesDone = profile?.completeness.sections.find((s) => s.key === 'languages')?.complete ?? false;
  const firstName = profile?.first_name ?? localProfile.firstName;
  const avatarInitials =
    `${profile?.first_name?.[0] ?? ''}${profile?.last_name?.[0] ?? ''}`.toUpperCase() || localProfile.avatarInitials;

  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const heroApplication = [...APPLICATIONS].sort((a, b) => b.stage - a.stage)[0];
  const otherApplications = APPLICATIONS.filter((application) => application.id !== heroApplication.id);
  const applicationTextFor = (id: number) => content.applications.items.find((item) => item.id === id)!;
  const recommendationTextFor = (id: number) => content.recommendations.items.find((item) => item.id === id)!;
  const heroApplicationText = applicationTextFor(heroApplication.id);

  return (
    <div>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 py-3.5 backdrop-blur-md lg:px-10 lg:py-5">
        <div>
          <h1 className="text-base font-extrabold text-primary lg:text-xl">
            {content.header.greeting.replace('{name}', firstName || content.header.fallbackName)}{' '}
            {content.header.greetingEmoji}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{content.header.spaceLabel}</p>
        </div>
        <div className="flex items-center gap-1">
          <LanguageSwitcher compact />
          <ThemeToggle />
          <IconButton variant="ghost" aria-label={content.header.notificationsAriaLabel} className="relative">
            <span className="material-symbols-outlined text-onSurface-variant" style={{ fontSize: 22 }}>
              notifications
            </span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-error" />
          </IconButton>
          <div className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-black text-onPrimary shadow-sm">
            {avatarInitials || '—'}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-md space-y-6 px-6 pb-8 pt-4 lg:max-w-6xl lg:px-10 lg:pt-8">
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-6 lg:col-span-2">
            <section className="fade-in-entry opacity-0 flex flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-subtle">
              <div className="mb-4 flex w-full items-center justify-between">
                <h2 className="text-sm font-extrabold text-onSurface">{content.profileProgress.title}</h2>
                <span className="text-xs font-extrabold text-primary">{percent}%</span>
              </div>
              <div
                className="relative mb-5 flex h-36 w-36 items-center justify-center rounded-full shadow-inner transition-all duration-500"
                style={{
                  background: `radial-gradient(closest-side, white 82%, transparent 83% 100%), conic-gradient(#006266 ${percent}%, #EDEEEF 0)`,
                }}
              >
                <span className="text-3xl font-black leading-none tracking-tight text-primary">{percent}%</span>
              </div>
              <p className="px-2 text-xs leading-relaxed text-onSurface-variant font-medium">
                {content.profileProgress.description}
              </p>
            </section>

            <div className="fade-in-entry stagger-1 opacity-0 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 shadow-sm">
                <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 16 }}>
                  {profile?.terms_consent_at && profile?.cndp_consent_at ? 'visibility' : 'visibility_off'}
                </span>
                <span className="text-xs font-medium text-onSurface">
                  {profile?.terms_consent_at && profile?.cndp_consent_at
                    ? content.visibility.visible
                    : content.visibility.hidden}
                </span>
              </div>
            </div>

            <section className="fade-in-entry stagger-2 opacity-0 space-y-3">
              <h2 className="text-lg font-extrabold text-primary">{content.checklist.title}</h2>
              <div className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle divide-y divide-surface-container-high">
                <ChecklistItem
                  label={content.checklist.items.personal.label}
                  status={isLoading ? 'pending' : personalDone ? 'done' : 'pending'}
                  href="/profile-creation?step=1"
                  actionLabel={personalDone ? undefined : content.checklist.items.personal.action}
                />
                <ChecklistItem
                  label={content.checklist.items.education.label}
                  status={isLoading ? 'pending' : educationDone ? 'done' : 'pending'}
                  href="/profile-creation?step=3"
                  actionLabel={educationDone ? undefined : content.checklist.items.education.action}
                />
                <ChecklistItem
                  label={content.checklist.items.languages.label}
                  status={isLoading ? 'pending' : languagesDone ? 'done' : 'pending'}
                  href="/profile-creation?step=4"
                  actionLabel={languagesDone ? undefined : content.checklist.items.languages.action}
                />
                <ChecklistItem
                  label={content.checklist.items.cv.label}
                  status={cvDone ? 'done' : 'pending'}
                  href="/documents"
                  actionLabel={content.checklist.items.cv.action}
                />
                <ChecklistItem
                  label={content.checklist.items.diploma.label}
                  status={diplomaDone ? 'done' : 'pending'}
                  href="/documents"
                  actionLabel={content.checklist.items.diploma.action}
                />
                <ChecklistItem
                  label={content.checklist.items.video.label}
                  status={videoDone ? 'done' : 'pending'}
                  href="/video"
                  actionLabel={content.checklist.items.video.action}
                />
                <ChecklistItem
                  label={content.checklist.items.test.label}
                  status={testDone ? 'done' : 'pending'}
                  href="/test-langue"
                  actionLabel={content.checklist.items.test.action}
                />
                <ChecklistItem
                  label={content.checklist.items.identity.label}
                  status={identityVerified ? 'done' : 'pending'}
                  href="/verification-identite"
                  actionLabel={content.checklist.items.identity.action}
                />
              </div>
            </section>
          </div>

          <section className="fade-in-entry stagger-3 opacity-0 space-y-3 lg:col-span-3">
            <h2 className="text-lg font-extrabold text-primary">{content.quickActions.title}</h2>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-3">
              {QUICK_ACTIONS.map((action) => (
                <Link
                  key={action.href}
                  href={action.href}
                  className="flex flex-col items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle transition-all duration-200 hover:border-primary/50 hover:bg-surface-container-low/50 active:scale-[0.98]"
                >
                  <div className="flex h-11 w-11 items-center justify-center rounded-pillar bg-surface-container-low text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                      {action.icon}
                    </span>
                  </div>
                  <span className="text-xs font-bold text-onSurface">{content.quickActions.items[action.key]}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>

        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <section className="fade-in-entry stagger-4 opacity-0 space-y-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-primary">{content.applications.title}</h2>
              <Link href="/offres" className="text-xs font-bold text-primary hover:underline">
                {content.applications.viewOffers}
              </Link>
            </div>

            <div className="relative rounded-pillar border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
              <div className="mb-5 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 items-center justify-center rounded-pillar bg-surface-container-low text-primary">
                    <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                      {heroApplication.icon}
                    </span>
                  </div>
                  <div>
                    <h3 className="text-sm font-extrabold text-onSurface">{heroApplicationText.title}</h3>
                    <p className="text-xs font-medium text-onSurface-variant">{heroApplication.company}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold text-tertiary">
                  {heroApplicationText.statusLabel}
                </span>
              </div>

              <div className="relative pb-1 pt-2">
                <div className="absolute left-[12%] right-[12%] top-[13px] h-0.5 bg-outline-variant" />
                <div
                  className="absolute left-[12%] top-[13px] h-0.5 bg-primary transition-all duration-500"
                  style={{ width: `${(heroApplication.stage / (content.applications.stages.length - 1)) * 76}%` }}
                />
                <div className="relative flex items-center justify-between">
                  {content.applications.stages.map((stage, i) => {
                    const done = i < heroApplication.stage;
                    const active = i === heroApplication.stage;
                    return (
                      <div key={stage} className="flex flex-1 flex-col items-center gap-1.5 text-center">
                        <span
                          className={`h-3.5 w-3.5 rounded-full ring-4 ring-surface-container-lowest ${
                            done
                              ? 'bg-primary'
                              : active
                                ? 'border-2 border-primary bg-surface-container-lowest'
                                : 'border border-outline-variant bg-surface-container-high'
                          }`}
                        />
                        <span className={`text-[10px] ${active ? 'font-extrabold text-primary' : 'font-medium text-onSurface-variant'}`}>
                          {stage}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
              <p className="mt-3 text-right text-[10px] text-onSurface-variant">
                {content.applications.updatedOn.replace('{date}', heroApplicationText.updatedAt)}
              </p>
            </div>

            {otherApplications.map((application) => {
              const applicationText = applicationTextFor(application.id);
              return (
                <div
                  key={application.id}
                  className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle"
                >
                  <div className="flex items-center gap-3">
                    <div className="flex h-10 w-10 items-center justify-center rounded-pillar bg-surface-container-low text-onSurface-variant">
                      <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
                        {application.icon}
                      </span>
                    </div>
                    <div>
                      <h4 className="text-sm font-bold text-onSurface">{applicationText.title}</h4>
                      <p className="text-xs font-medium text-onSurface-variant">{application.company}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="block text-xs font-bold text-onSurface">{applicationText.statusLabel}</span>
                    <span className="text-[10px] text-outline">{applicationText.updatedAt}</span>
                  </div>
                </div>
              );
            })}
          </section>

          <section className="fade-in-entry stagger-4 opacity-0 space-y-3 lg:col-span-2">
            <h2 className="text-lg font-extrabold text-primary">{content.recommendations.title}</h2>
            {RECOMMENDATIONS.map((offer) => {
              const applied = appliedIds.includes(offer.id);
              const offerText = recommendationTextFor(offer.id);
              return (
                <div key={offer.id} className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-5 shadow-subtle">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-11 w-11 items-center justify-center rounded-pillar bg-surface-container-low text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                        {offer.icon}
                      </span>
                    </div>
                    <span className="flex items-center gap-1 rounded-md bg-primary/10 px-2 py-1 text-[11px] font-bold text-primary">
                      <span className="material-symbols-outlined" style={{ fontSize: 13 }}>
                        bolt
                      </span>
                      {content.recommendations.matchBadge.replace('{value}', String(offer.match))}
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-onSurface">{offerText.title}</h3>
                  <p className="mb-3 text-xs font-medium text-onSurface-variant">{offer.company}</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[offerText.location, offerText.contract].map((tag) => (
                      <span key={tag} className="rounded-md bg-surface-container-low px-2 py-1 text-[11px] font-semibold text-onSurface-variant">
                        {tag}
                      </span>
                    ))}
                  </div>
                  <Button
                    variant={applied ? 'tonal' : 'primary'}
                    size="sm"
                    fullWidth
                    disabled={applied}
                    onClick={() => setAppliedIds((prev) => [...prev, offer.id])}
                    leadingIcon={
                      applied ? (
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                          check_circle
                        </span>
                      ) : undefined
                    }
                  >
                    {applied ? content.recommendations.appliedButton : content.recommendations.applyButton}
                  </Button>
                </div>
              );
            })}
          </section>
        </div>
      </main>
    </div>
  );
}

