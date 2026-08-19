'use client';

// Interface 15 — Profil public candidat (aperçu + édition).

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Button, IconButton } from '@/components/shared/Button';
import { useRouter } from 'next/navigation';
import { useProfile } from '@/context/ProfileContext';
import { useAuth } from '@/context/AuthContext';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { QRCodeGenerator } from '@/components/shared/QRCodeGenerator';
import { Timeline } from '@/components/shared/Timeline';
import { SkeletonLoader } from '@/components/shared/SkeletonLoader';
import { candidateRepository } from '@/data/candidate';
import type { TimelineStep } from '@/lib/types';

export default function ProfilPage() {
  const router = useRouter();
  const [timeline, setTimeline] = useState<TimelineStep[]>([]);

  useEffect(() => {
    let cancelled = false;
    candidateRepository
      .timeline()
      .then((steps) => {
        if (!cancelled) setTimeline(steps);
      })
      .catch(() => {
        // Le parcours est une section secondaire du profil : s'il manque, le
        // reste de la page reste utile. Le squelette laisse simplement place
        // à rien plutôt que de faire échouer l'écran entier.
        if (!cancelled) setTimeline([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);
  const { logout } = useAuth();
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
    <div className="min-h-screen bg-surface pb-32">
      <header className="sticky top-0 z-20 flex items-center justify-between border-b border-outline-variant/20 bg-surface/80 px-6 py-4 backdrop-blur-md lg:px-10">
        <Link href="/dashboard" aria-label="Retour au tableau de bord" className="flex items-center text-primary hover:opacity-80 transition-opacity">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-semibold text-primary">Mon profil public</h1>
        <IconButton variant="ghost" onClick={() => setShowQr((v) => !v)} aria-label="Partager" className="text-primary">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 22 }}>ios_share</span>
        </IconButton>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6 lg:max-w-6xl lg:px-10 lg:pt-8">
        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <div className="space-y-6 lg:col-span-2">
            <section className="flex flex-col items-center gap-3 text-center">
              <div className="relative">
                <div className="flex h-32 w-32 items-center justify-center rounded-full border-4 border-surface-lowest bg-primary-light text-4xl font-bold text-primary shadow-lg">
                  {profile.avatarInitials || '?'}
                </div>
                <div className="absolute bottom-1 right-1 h-7 w-7 rounded-full border-4 border-surface-lowest bg-primary" />
              </div>
              <div className="space-y-1">
                <h2 className="text-3xl font-extrabold tracking-tight text-primary">{profile.firstName || 'Candidat'}</h2>
                <div className="flex items-center justify-center gap-1 text-onSurface-variant">
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }}>location_on</span>
                  <span className="text-sm font-medium">{profile.city || 'Maroc'}</span>
                </div>
                <div className="mt-2 inline-flex items-center rounded-full bg-primary-light px-3 py-1 text-xs font-bold uppercase tracking-wider text-onPrimary-container">
                  {profile.noticePeriodWeeks === 0 ? 'Immédiat' : `Sous ${profile.noticePeriodWeeks} semaines`}
                </div>
              </div>
            </section>

            <section className="flex items-start gap-4 rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-primary-light/60 text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 24 }}>work</span>
              </div>
              {isEditing ? (
                <div className="flex-1 space-y-2">
                  <label htmlFor="profil-job-title" className="sr-only">Métier</label>
                  <input
                    id="profil-job-title"
                    value={form.jobTitle}
                    onChange={(e) => setForm((p) => ({ ...p, jobTitle: e.target.value }))}
                    placeholder="Métier"
                    className="w-full rounded-lg border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                  <label htmlFor="profil-city" className="sr-only">Ville</label>
                  <input
                    id="profil-city"
                    value={form.city}
                    onChange={(e) => setForm((p) => ({ ...p, city: e.target.value }))}
                    placeholder="Ville"
                    className="w-full rounded-lg border border-outline px-3 py-2 text-sm outline-none focus:border-primary"
                  />
                </div>
              ) : (
                <div className="flex-1">
                  <h3 className="text-lg font-bold text-primary">{profile.jobTitle || 'Métier non renseigné'}</h3>
                  <p className="text-sm text-onSurface-variant">{profile.sector || '—'} · {profile.yearsExperience} ans d&apos;expérience</p>
                </div>
              )}
              <Button
                variant="link"
                size="sm"
                onClick={() => (isEditing ? handleSave() : setIsEditing(true))}
                className="shrink-0 gap-1 font-semibold"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>{isEditing ? 'check' : 'edit'}</span>
                {isEditing ? 'Enregistrer' : 'Modifier'}
              </Button>
            </section>
          </div>

          <div className="space-y-6 lg:col-span-3">
        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">Langues</h3>
          {profile.languages.length === 0 ? (
            <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
              Aucune langue renseignée.
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
            <h3 className="text-lg font-bold text-primary">Ma présentation</h3>
            {profile.testLangueScore !== null && (
              <span className="text-sm font-bold text-primary">Score IA : {profile.testLangueScore}</span>
            )}
          </div>
          <VideoPlayer src={profile.videoUrl} />
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">Parcours</h3>
          <div className="rounded-xl border border-outline-variant/30 bg-surface-lowest p-4 shadow-soft">
            {timeline.length > 0 ? (
              <Timeline steps={timeline.slice(0, 2)} />
            ) : (
              <SkeletonLoader variant="card" />
            )}
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">Outils & Certifications</h3>
          <div className="grid grid-cols-1 gap-2.5">
            <Link
              href="/visibilite"
              className="flex items-center justify-between rounded-pillar border border-outline-variant bg-surface-container-lowest p-3.5 shadow-subtle hover:bg-surface-container-low transition-colors"
            >
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }}>
                  insights
                </span>
                <span className="text-xs font-bold text-onSurface">Score de visibilité candidat</span>
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
                <span className="text-xs font-bold text-onSurface">Vérification d&apos;identité (Passeport)</span>
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
                <span className="text-xs font-bold text-onSurface">Programme de Parrainage</span>
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
                <span className="text-xs font-bold text-onSurface">Préférences de matching</span>
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
                <span className="text-xs font-bold text-onSurface">Simuler mon salaire</span>
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
                <span className="text-xs font-bold text-onSurface">Quiz métier</span>
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
                <span className="text-xs font-bold text-onSurface">Allemand du quotidien</span>
              </div>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }}>
                chevron_right
              </span>
            </Link>
          </div>
        </section>

        <section className="space-y-3">
          <h3 className="px-1 text-lg font-bold text-primary">Documents ({profile.documents.length})</h3>
          <div className="space-y-2.5 lg:grid lg:grid-cols-2 lg:gap-2.5 lg:space-y-0">
            {profile.documents.length === 0 ? (
              <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant lg:col-span-2">
                Aucun document ajouté.
              </p>
            ) : (
              profile.documents.map((doc) => <DocumentViewer key={doc.id} document={doc} />)
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
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              logout
            </span>
            Se déconnecter
          </Button>
        </section>
      </main>

      {showQr && (
        <div className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-4 bg-surface p-6">
          <IconButton
            variant="ghost"
            onClick={() => setShowQr(false)}
            aria-label="Fermer"
            className="absolute right-6 top-6 text-primary"
          >
            <span className="material-symbols-outlined text-primary" style={{ fontSize: 28 }}>close</span>
          </IconButton>
          <h2 className="text-lg font-bold text-primary">Partager mon profil</h2>
          <div className="flex flex-col items-center gap-3 rounded-xl border border-outline-variant/20 bg-surface-lowest p-6 shadow-lg">
            <QRCodeGenerator value={shareUrl} size={220} />
            <span className="text-xs font-bold text-primary">SCAN ME</span>
          </div>
        </div>
      )}
    </div>
  );
}
