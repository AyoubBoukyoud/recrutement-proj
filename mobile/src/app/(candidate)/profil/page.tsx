'use client';

// Interface 15 — Profil public candidat (aperçu + édition).

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { useLanguage } from '@/context/LanguageContext';
import { AvatarUpload } from '@/components/shared/AvatarUpload';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';
import { Timeline } from '@/components/shared/Timeline';
import { WithPageSkeleton } from '@/components/shared/SkeletonLoader';
import { MOCK_TIMELINE } from '@/lib/mockData';

export default function ProfilPage() {
  const router = useRouter();
  const { logout } = useAuth();
  const { t } = useLanguage();
  const { profile, updateProfile } = useProfile();
  const [isEditing, setIsEditing] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const [form, setForm] = useState({ jobTitle: profile.jobTitle, city: profile.city });

  const handleLogout = () => {
    logout();
    router.replace('/auth-phone');
  };

  const handleSave = () => {
    updateProfile(form);
    setIsEditing(false);
  };

  const shareUrl = `https://amudskills.app/p/${profile.avatarInitials || 'candidat'}`;

  return (
    <WithPageSkeleton layout="profile">
    <div className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" aria-label={t('candidateB:profil.backAriaLabel')} className="flex items-center text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">{t('candidateB:profil.title')}</h1>
        <button
          type="button"
          onClick={() => setShowQr((v) => !v)}
          className="rounded-full p-2 transition-colors hover:bg-surface-container"
          aria-label={t('candidateB:profil.shareAriaLabel')}
        >
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>ios_share</span>
        </button>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6">
        <section className="flex flex-col items-center gap-3 text-center">
          <AvatarUpload
            imageUrl={profile.avatarUrl}
            fallbackText={profile.avatarInitials || '?'}
            onChange={(dataUrl) => updateProfile({ avatarUrl: dataUrl })}
            ariaLabel={t('candidateB:profil.changePhotoAriaLabel')}
          />
          <div className="space-y-1">
            <h2 className="text-3xl font-extrabold tracking-tight text-primary">{profile.firstName || t('candidateB:profil.defaultName')}</h2>
            <div className="flex items-center justify-center gap-1 text-onSurface-variant">
              <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
              <span className="text-sm font-medium">{profile.city || t('candidateB:profil.defaultCity')}</span>
            </div>
            <div className="mt-2 inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-onPrimary-container">
              {profile.noticePeriodWeeks === 0 ? t('candidateB:profil.noticeImmediate') : t('candidateB:profil.noticeWeeks', { weeks: profile.noticePeriodWeeks })}
            </div>
          </div>
        </section>

        <section className="flex items-start gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light/60 text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>work</span>
          </div>
          {isEditing ? (
            <div className="flex-1 space-y-2">
              <input
                value={form.jobTitle}
                onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                placeholder={t('candidateB:profil.jobTitlePlaceholder')}
                className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
              />
              <input
                value={form.city}
                onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                placeholder={t('candidateB:profil.cityPlaceholder')}
                className="w-full rounded-lg border border-outline-variant px-3 py-2 text-sm outline-none focus:border-primary"
              />
            </div>
          ) : (
            <div className="flex-1">
              <h3 className="text-lg font-bold text-primary">{profile.jobTitle || t('candidateB:profil.jobTitleUnset')}</h3>
              <p className="text-sm text-onSurface-variant">{profile.sector || '—'} · {t('candidateB:profil.yearsExperience', { years: profile.yearsExperience })}</p>
            </div>
          )}
          <button
            type="button"
            onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
            className="flex shrink-0 items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{isEditing ? 'check' : 'edit'}</span>
            {isEditing ? t('candidateB:profil.save') : t('candidateB:profil.edit')}
          </button>
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">{t('candidateB:profil.languagesTitle')}</h3>
          {profile.languages.length === 0 ? (
            <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
              {t('candidateB:profil.noLanguages')}
            </p>
          ) : (
            <div className="-mx-6 flex gap-4 overflow-x-auto px-6 pb-2">
              {profile.languages.map((lang) => (
                <div
                  key={lang.language}
                  className="min-w-[220px] space-y-3 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft"
                >
                  <div className="flex items-start justify-between">
                    <span className="text-lg font-bold text-primary">{lang.language}</span>
                    {lang.level && (
                      <span className="rounded bg-primary-light px-2 py-0.5 text-xs font-bold text-onPrimary-container">
                        {lang.level}
                      </span>
                    )}
                  </div>
                  <CEFRGauge level={lang.level} />
                </div>
              ))}
            </div>
          )}
        </section>

        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-lg font-bold text-primary">{t('candidateB:profil.presentationTitle')}</h3>
            {profile.testLangueScore !== null && (
              <span className="text-sm font-bold text-primary">{t('candidateB:profil.aiScore', { score: profile.testLangueScore })}</span>
            )}
          </div>
          <VideoPlayer src={profile.videoUrl} />
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">{t('candidateB:profil.pathTitle')}</h3>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
            <Timeline steps={MOCK_TIMELINE.slice(0, 2)} />
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">{t('candidateB:profil.toolsTitle')}</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <Link
              href="/visibilite"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  insights
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.visibilityScore')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/verification-identite"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  verified_user
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.identityVerification')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/parrainage"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  group_add
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.referralProgram')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/matching-preferences"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  tune
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.matchingPreferences')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/salaire"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  payments
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.simulateSalary')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/quiz-metier"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  quiz
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.jobQuiz')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>

            <Link
              href="/lecon-jour"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  translate
                </span>
                <span className="text-xs font-bold text-onSurface">{t('candidateB:profil.dailyGerman')}</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">{t('candidateB:profil.documentsTitle', { count: profile.documents.length })}</h3>
          <div className="space-y-2.5">
            {profile.documents.length === 0 ? (
              <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
                {t('candidateB:profil.noDocuments')}
              </p>
            ) : (
              profile.documents.map((doc) => <DocumentViewer key={doc.id} document={doc} />)
            )}
          </div>
        </section>

        <section>
          <button
            type="button"
            onClick={handleLogout}
            className="flex w-full items-center justify-center gap-2 rounded-pillar border border-error/20 bg-surface-container-lowest p-3.5 text-sm font-bold text-error shadow-subtle transition-colors hover:bg-error-container/20"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              logout
            </span>
            {t('candidateB:profil.logout')}
          </button>
        </section>
      </main>

      {showQr && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface p-6">
          <button
            type="button"
            onClick={() => setShowQr(false)}
            aria-label={t('candidateB:profil.closeAriaLabel')}
            className="absolute right-6 top-6 rounded-full p-2 transition-colors hover:bg-surface-container"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>close</span>
          </button>
          <h2 className="text-lg font-bold text-primary">{t('candidateB:profil.shareTitle')}</h2>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-lowest p-6 shadow-lg">
            <QRCodeGenerator value={shareUrl} size={220} />
            <span className="text-xs font-bold text-primary">{t('candidateB:profil.scanMe')}</span>
          </div>
        </div>
      )}
    </div>
    </WithPageSkeleton>
  );
}
