'use client';

// Page : Score de visibilité — Candidat.
//
// Le score est la vraie complétude du dossier (ProfileCompleteness côté
// back, déjà affichée sur le tableau de bord), pas un indicateur inventé :
// l'ancienne version montrait un score, un niveau et des badges (« Python
// Pro », « Test Arabe C2 ») qui n'avaient aucune donnée derrière.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCandidateProfile } from '@/lib/useCandidateProfile';
import { documentsRepository } from '@/data/documents';

const CIRCUMFERENCE = 263.89;

export default function VisibilitePage() {
  const { token } = useAuth();
  const { data: profile, isLoading } = useCandidateProfile();
  const [identityVerified, setIdentityVerified] = useState(false);
  const [dashOffset, setDashOffset] = useState(CIRCUMFERENCE);

  const percent = profile?.completeness.percent ?? 0;
  const visible = Boolean(profile?.terms_consent_at && profile?.cndp_consent_at);
  const videoDone = Boolean(profile?.presentation_video_path);
  const languageDone = profile?.completeness.sections.find((s) => s.key === 'languages')?.complete ?? false;

  useEffect(() => {
    const timer = setTimeout(() => {
      setDashOffset(CIRCUMFERENCE - (percent / 100) * CIRCUMFERENCE);
    }, 300);
    return () => clearTimeout(timer);
  }, [percent]);

  useEffect(() => {
    if (!token) return;
    documentsRepository
      .list(token)
      .then((docs) => setIdentityVerified(docs.some((d) => d.type === 'identity' && d.approval_status === 'approved')))
      .catch(() => setIdentityVerified(false));
  }, [token]);

  return (
    <div className="min-h-screen bg-surface pb-24 text-onSurface">
      <header className="sticky top-0 z-40 mx-auto flex w-full max-w-xl items-center justify-between border-b border-surface-container-high bg-surface px-4 py-4 lg:max-w-6xl lg:px-10">
        <Link
          href="/dashboard"
          aria-label="Retour"
          className="flex items-center text-primary transition-opacity hover:opacity-80 active:scale-95"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
            arrow_back
          </span>
        </Link>
        <h1 className="text-xl font-extrabold text-primary">Ma visibilité</h1>
        <span className="w-6" />
      </header>

      <main className="mx-auto mt-6 max-w-xl px-4 lg:max-w-6xl lg:px-10">
        <div className="lg:grid lg:grid-cols-[320px_1fr] lg:items-start lg:gap-10">
        <section className="mb-10 flex flex-col items-center">
          <div className="relative flex h-48 w-48 items-center justify-center">
            <svg className="h-full w-full" viewBox="0 0 100 100">
              <circle
                className="stroke-current text-surface-container-high"
                cx="50"
                cy="50"
                fill="transparent"
                r="42"
                strokeWidth="8"
              />
              <circle
                className="progress-ring__circle stroke-current text-gold-dark transition-all duration-1000 ease-in-out"
                cx="50"
                cy="50"
                fill="transparent"
                r="42"
                strokeLinecap="round"
                strokeWidth="8"
                style={{
                  strokeDasharray: `${CIRCUMFERENCE} ${CIRCUMFERENCE}`,
                  strokeDashoffset: dashOffset,
                  transform: 'rotate(-90deg)',
                  transformOrigin: '50% 50%',
                }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-5xl font-black text-onSurface">{isLoading ? '—' : percent}</span>
              <span className="text-sm font-semibold text-outline">/ 100</span>
            </div>
          </div>
          <div
            className={`mt-4 flex items-center gap-2 rounded-full px-4 py-1 text-xs font-bold shadow-sm border ${
              visible
                ? 'bg-gold/20 text-tertiary border-gold/30'
                : 'bg-surface-container-low text-onSurface-variant border-outline-variant'
            }`}
          >
            <span className="material-symbols-outlined fill text-[18px]">
              {visible ? 'visibility' : 'visibility_off'}
            </span>
            {visible ? 'Visible par les recruteurs' : 'Pas encore visible'}
          </div>
        </section>

        <div>
        <section className="mb-10 space-y-4">
          {(profile?.completeness.sections ?? [])
            .filter((s) => s.required)
            .map((section) => (
              <div key={section.key} className="rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 shadow-subtle backdrop-blur-md">
                <div className="mb-2 flex items-center justify-between">
                  <span className="text-sm font-medium text-onSurface capitalize">{SECTION_LABELS[section.key] ?? section.key}</span>
                  <span className={`text-sm font-extrabold ${section.complete ? 'text-primary' : 'text-onSurface-variant'}`}>
                    {section.complete ? 'Fait' : 'À faire'}
                  </span>
                </div>
                <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                  <div className="h-2 rounded-full bg-primary" style={{ width: section.complete ? '100%' : '0%' }} />
                </div>
              </div>
            ))}
        </section>

        {(!videoDone || !languageDone) && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-onSurface">Conseils pour progresser</h2>
            <div className="space-y-4">
              {!videoDone && (
                <div className="flex flex-col gap-4 rounded-pillar border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-4 shadow-subtle">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-low text-primary">
                      <span className="material-symbols-outlined text-[24px]">videocam</span>
                    </div>
                    <p className="text-sm leading-relaxed text-onSurface font-medium">
                      Ajoutez une vidéo de présentation pour compléter votre dossier.
                    </p>
                  </div>
                  <Link
                    href="/video"
                    className="block w-full rounded-pillar bg-primary py-3 text-center text-sm font-bold text-onPrimary transition-all hover:bg-primary/90 active:scale-[0.98]"
                  >
                    Filmer
                  </Link>
                </div>
              )}

              {!languageDone && (
                <div className="flex flex-col gap-4 rounded-pillar border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-4 shadow-subtle">
                  <div className="flex gap-3">
                    <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-surface-container-high text-onSurface">
                      <span className="material-symbols-outlined text-[24px]">language</span>
                    </div>
                    <p className="text-sm leading-relaxed text-onSurface font-medium">
                      Renseignez au moins une langue pour compléter votre dossier.
                    </p>
                  </div>
                  <Link
                    href="/profile-creation?step=4"
                    className="block w-full rounded-pillar border border-primary py-3 text-center text-sm font-bold text-primary transition-all hover:bg-surface-container-low active:scale-[0.98]"
                  >
                    Renseigner mes langues
                  </Link>
                </div>
              )}
            </div>
          </section>
        )}

        {identityVerified && (
          <section className="mb-10">
            <h2 className="mb-4 text-xl font-bold text-onSurface">Badges</h2>
            <div className="flex gap-4 overflow-x-auto pb-4">
              <div className="flex w-32 shrink-0 flex-col items-center rounded-pillar border border-outline-variant bg-surface-container-lowest p-4 text-center shadow-subtle">
                <div className="mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <span className="material-symbols-outlined fill text-[28px]">verified_user</span>
                </div>
                <span className="text-xs font-bold leading-tight text-onSurface">Identité vérifiée</span>
              </div>
            </div>
          </section>
        )}
        </div>
        </div>
      </main>
    </div>
  );
}

const SECTION_LABELS: Record<string, string> = {
  personal: 'Informations personnelles',
  education: 'Formation',
  languages: 'Langues',
  availability: 'Disponibilité',
  consents: 'Consentements',
};
