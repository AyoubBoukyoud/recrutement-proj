'use client';

// Interface 10 — Tableau de bord candidat.

import { useEffect, useState } from 'react';
import Link from 'next/link';
import toast from 'react-hot-toast';
import { AnimatedLink } from '@/components/shared/AnimatedLink';
import { useProfile } from '@/context/ProfileContext';
import { ChecklistItem } from '@/components/shared/ChecklistItem';
import { useLanguage } from '@/context/LanguageContext';
import { usePageLoading } from '@/hooks/usePageLoading';
import { PageSkeleton } from '@/components/shared/SkeletonLoader';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';

const QUICK_ACTIONS = [
  { href: '/documents', label: 'dashboard.quickActions.addDocument', icon: 'description' },
  { href: '/video', label: 'dashboard.quickActions.recordVideo', icon: 'videocam' },
  { href: '/test-langue', label: 'dashboard.quickActions.languageTest', icon: 'mic' },
  { href: '/profil', label: 'dashboard.quickActions.viewPublicProfile', icon: 'account_circle' },
  { href: '/cours-allemand', label: 'dashboard.quickActions.germanLessonOfDay', icon: 'translate' },
  { href: '/offres', label: 'dashboard.quickActions.viewJobOffers', icon: 'work' },
  { href: '/simulateur-salaire', label: 'dashboard.quickActions.simulateSalary', icon: 'calculate' },
  { href: '/visibilite', label: 'dashboard.quickActions.myVisibility', icon: 'insights' },
  { href: '/parrainage', label: 'dashboard.quickActions.referFriend', icon: 'group_add' },
  { href: '/verification-identite', label: 'dashboard.quickActions.verifyIdentity', icon: 'verified_user' },
  { href: '/matching-preferences', label: 'dashboard.quickActions.matchingPreferences', icon: 'tune' },
];

export default function DashboardPage() {
  const { profile } = useProfile();
  const { t } = useLanguage();
  const isLoading = usePageLoading();
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showQr, setShowQr] = useState(false);
  const shareUrl = `https://amudskills.app/p/${profile.avatarInitials || 'candidat'}`;

  useEffect(() => {
    if (isLoading) return;
    // Welcome toast notification when the dashboard loads
    toast(`Bienvenue, ${profile.firstName || 'Candidat'} !`, {
      icon: '👋',
      duration: 3000,
      position: 'top-center',
    });
  }, [profile.firstName, isLoading]);

  const speakWortDesTages = (word: string) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(word);
      utterance.lang = 'de-DE';
      utterance.rate = 0.85;
      setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      window.speechSynthesis.speak(utterance);
      toast.success(`🔊 Prononciation: "${word}"`, { duration: 2000, position: 'bottom-center' });
    } else {
      toast('🔊 Sound effect played', { duration: 1500 });
    }
  };

  const cvDone = profile.documents.some((d) => d.type === 'cv');
  const diplomaDone = profile.documents.some((d) => d.type === 'diplome' || d.type === 'autre');
  const videoDone = Boolean(profile.videoUrl);
  const testDone = profile.testLangueScore !== null;
  const doneCount = [cvDone, diplomaDone, videoDone, testDone].filter(Boolean).length;
  const percent = 20 + doneCount * 20;

  if (isLoading) return <PageSkeleton layout="dashboard" />;

  return (
    <div>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 py-3.5 backdrop-blur-md">
        <div>
          <h1 className="text-base font-extrabold text-primary">
            {t('candidateC:dashboard.greeting', { name: profile.firstName || t('candidateC:dashboard.defaultName') })}
          </h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">{t('candidateC:dashboard.spaceLabel')}</p>
        </div>
        <div className="flex items-center gap-2">
          <button type="button" className="relative rounded-full p-2 transition-colors hover:bg-surface-container-low active:scale-95">
            <span className="material-symbols-outlined text-onSurface-variant" style={{ fontSize: 22 }}>
              notifications
            </span>
            <span className="absolute right-1.5 top-1.5 h-2 w-2 rounded-full border border-surface bg-error" />
          </button>
          <button
            type="button"
            onClick={() => setShowQr(true)}
            className="rounded-full p-2 transition-colors hover:bg-surface-container-low active:scale-95"
            aria-label={t('candidateB:profil.shareAriaLabel')}
          >
            <span className="material-symbols-outlined text-onSurface-variant" style={{ fontSize: 22 }}>
              ios_share
            </span>
          </button>
          <Link
            href="/profil"
            aria-label={t('candidateB:profil.title')}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary text-xs font-black text-onPrimary shadow-sm"
          >
            {profile.avatarInitials || '—'}
          </Link>
        </div>
      </header>

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

      <main className="mx-auto w-full max-w-md md:max-w-4xl space-y-6 px-6 pb-8 pt-4">
        {/* Wort des Tages Card */}
        <section className="rounded-2xl border border-primary/25 bg-gradient-to-r from-primary/10 via-surface-container-lowest to-surface-container-low p-5 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                translate
              </span>
              <span className="text-xs font-black uppercase tracking-wider text-primary">Wort des Tages (Mot du Jour)</span>
            </div>
            <span className="rounded-full bg-secondary/20 px-2.5 py-0.5 text-[10px] font-extrabold text-tertiary">
              Niveau A1/B1
            </span>
          </div>

          <div className="mt-3 flex items-center justify-between">
            <div>
              <h3 className="text-2xl font-black text-primary">die Arbeitsstelle</h3>
              <p className="text-xs font-semibold text-onSurface-variant">Français: <span className="font-extrabold text-onSurface">L'emploi / Le poste de travail</span></p>
              <p className="text-[11px] italic text-outline mt-0.5">"Ich habe eine gute Arbeitsstelle in Deutschland."</p>
            </div>
            <button
              type="button"
              onClick={() => speakWortDesTages('die Arbeitsstelle')}
              className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-primary text-onPrimary shadow-md transition-all hover:scale-105 active:scale-95 ${
                isPlayingAudio ? 'animate-pulse' : ''
              }`}
              title="Écouter la prononciation"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                volume_up
              </span>
            </button>
          </div>
        </section>

        <section className="fade-in-entry opacity-0 flex flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-subtle">
          <div className="mb-4 flex w-full items-center justify-between">
            <h2 className="text-sm font-extrabold text-onSurface">{t('candidateC:dashboard.progressTitle')}</h2>
            <span className="text-xs font-extrabold text-primary">{percent}%</span>
          </div>
          <div
            className="relative mb-5 flex h-36 w-36 items-center justify-center rounded-full shadow-inner transition-all duration-500"
            style={{
              background: `radial-gradient(closest-side, white 82%, transparent 83% 100%), conic-gradient(#1B5E37 ${percent}%, #EDEEEF 0)`,
            }}
          >
            <span className="text-3xl font-black leading-none tracking-tight text-primary">{percent}%</span>
          </div>
          <p className="px-2 text-xs leading-relaxed text-onSurface-variant font-medium">
            {t('candidateC:dashboard.progressDescription')}
          </p>
        </section>

        <div className="fade-in-entry stagger-1 opacity-0 flex items-center justify-center">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 shadow-sm">
            <span className="material-symbols-outlined fill animate-pulse text-primary" style={{ fontSize: 16 }}>
              visibility
            </span>
            <span className="text-xs font-medium text-onSurface">
              {t('candidateC:dashboard.visibleByPrefix')} <span className="font-extrabold text-primary">{t('candidateC:dashboard.visibleByCount', { count: 12 })}</span>
            </span>
          </div>
        </div>

        <section className="fade-in-entry stagger-2 opacity-0 space-y-3">
          <h2 className="text-lg font-extrabold text-primary">{t('candidateC:dashboard.toCompleteTitle')}</h2>
          <div className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle divide-y divide-surface-container-high">
            <ChecklistItem label={t('candidateC:dashboard.checklist.personalProfile')} status="done" />
            <ChecklistItem label={t('candidateC:dashboard.checklist.sectorQualification')} status="done" />
            <ChecklistItem
              label={t('candidateC:dashboard.checklist.cv')}
              status={cvDone ? 'done' : 'pending'}
              href="/documents"
              actionLabel={t('candidateC:dashboard.checklist.addAction')}
            />
            <ChecklistItem
              label={t('candidateC:dashboard.checklist.diploma')}
              status={diplomaDone ? 'done' : 'pending'}
              href="/documents"
              actionLabel={t('candidateC:dashboard.checklist.addAction')}
            />
            <ChecklistItem
              label={t('candidateC:dashboard.checklist.video')}
              status={videoDone ? 'done' : 'pending'}
              href="/video"
              actionLabel={t('candidateC:dashboard.checklist.recordAction')}
            />
            <ChecklistItem
              label={t('candidateC:dashboard.checklist.languageTest')}
              status={testDone ? 'done' : 'pending'}
              href="/test-langue"
              actionLabel={t('candidateC:dashboard.checklist.takeTestAction')}
            />
            <ChecklistItem
              label={t('candidateC:dashboard.checklist.identity')}
              status={profile.identityVerified ? 'done' : 'pending'}
              href="/verification-identite"
              actionLabel={t('candidateC:dashboard.checklist.verifyAction')}
            />
          </div>
        </section>

        <section className="fade-in-entry stagger-3 opacity-0 space-y-3">
          <h2 className="text-lg font-extrabold text-primary">{t('candidateC:dashboard.quickActionsTitle')}</h2>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3 md:gap-4">
            {QUICK_ACTIONS.map((action) => (
              <AnimatedLink
                key={action.href}
                href={action.href}
                className="flex flex-col items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle transition-all duration-200 hover:border-primary/50 hover:bg-surface-container-low/50"
              >
                <div className="flex h-11 w-11 items-center justify-center rounded-pillar bg-surface-container-low text-primary">
                  <span className="material-symbols-outlined" style={{ fontSize: 26 }}>
                    {action.icon}
                  </span>
                </div>
                <span className="text-xs font-bold text-onSurface">{t(`candidateC:${action.label}`)}</span>
              </AnimatedLink>
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

