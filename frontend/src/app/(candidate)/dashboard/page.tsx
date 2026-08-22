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
import { IconButton } from '@/components/shared/Button';

const QUICK_ACTIONS = [
  { href: '/documents', label: 'Ajouter un document', icon: 'description' },
  { href: '/video', label: 'Enregistrer une vidéo', icon: 'videocam' },
  { href: '/test-langue', label: 'Passer le test de langue', icon: 'mic' },
  { href: '/profil', label: 'Voir mon profil public', icon: 'account_circle' },
  { href: '/lecon-jour', label: "Leçon d'allemand du jour", icon: 'translate' },
  { href: '/offres', label: "Voir les offres d'emploi", icon: 'work' },
  { href: '/salaire', label: 'Simuler mon salaire', icon: 'calculate' },
  { href: '/visibilite', label: 'Ma visibilité', icon: 'insights' },
  { href: '/parrainage', label: 'Parrainer un ami', icon: 'group_add' },
  { href: '/verification-identite', label: 'Vérifier mon identité', icon: 'verified_user' },
  { href: '/matching-preferences', label: 'Préférences de matching', icon: 'tune' },
];

export default function DashboardPage() {
  // Vérification d'identité reste sur l'écran dédié (son propre document
  // approuvé fait foi) — ce tableau de bord ne la refait pas ici.
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

  return (
    <div>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 py-3.5 backdrop-blur-md lg:px-10 lg:py-5">
        <div>
          <h1 className="text-base font-extrabold text-primary lg:text-xl">Bonjour, {firstName || 'Candidat'} 👋</h1>
          <p className="text-[10px] font-bold uppercase tracking-wider text-tertiary">Espace Candidat</p>
        </div>
        <div className="flex items-center gap-3">
          <IconButton variant="ghost" aria-label="Notifications" className="relative">
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
                <h2 className="text-sm font-extrabold text-onSurface">Progression du profil</h2>
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
                Complétez votre profil pour apparaître en priorité auprès des recruteurs allemands.
              </p>
            </section>

            <div className="fade-in-entry stagger-1 opacity-0 flex items-center justify-center">
              <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-surface-container-low px-4 py-2 shadow-sm">
                <span className="material-symbols-outlined fill text-primary" style={{ fontSize: 16 }}>
                  {profile?.terms_consent_at && profile?.cndp_consent_at ? 'visibility' : 'visibility_off'}
                </span>
                <span className="text-xs font-medium text-onSurface">
                  {profile?.terms_consent_at && profile?.cndp_consent_at
                    ? 'Visible par les recruteurs'
                    : "Pas encore visible — acceptez les conditions à l'étape 6"}
                </span>
              </div>
            </div>

            <section className="fade-in-entry stagger-2 opacity-0 space-y-3">
              <h2 className="text-lg font-extrabold text-primary">À compléter</h2>
              <div className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle divide-y divide-surface-container-high">
                <ChecklistItem
                  label="Profil personnel complété"
                  status={isLoading ? 'pending' : personalDone ? 'done' : 'pending'}
                  href="/profile-creation?step=1"
                  actionLabel={personalDone ? undefined : 'Compléter'}
                />
                <ChecklistItem
                  label="Formation renseignée"
                  status={isLoading ? 'pending' : educationDone ? 'done' : 'pending'}
                  href="/profile-creation?step=3"
                  actionLabel={educationDone ? undefined : 'Compléter'}
                />
                <ChecklistItem
                  label="Au moins une langue évaluée"
                  status={isLoading ? 'pending' : languagesDone ? 'done' : 'pending'}
                  href="/profile-creation?step=4"
                  actionLabel={languagesDone ? undefined : 'Compléter'}
                />
                <ChecklistItem label="CV téléchargé" status={cvDone ? 'done' : 'pending'} href="/documents" actionLabel="Ajouter" />
                <ChecklistItem label="Certificats / diplômes" status={diplomaDone ? 'done' : 'pending'} href="/documents" actionLabel="Ajouter" />
                <ChecklistItem label="Vidéo de présentation" status={videoDone ? 'done' : 'pending'} href="/video" actionLabel="Enregistrer" />
                <ChecklistItem label="Test de langue" status={testDone ? 'done' : 'pending'} href="/test-langue" actionLabel="Passer le test" />
                <ChecklistItem
                  label="Identité vérifiée"
                  status={identityVerified ? 'done' : 'pending'}
                  href="/verification-identite"
                  actionLabel="Vérifier"
                />
              </div>
            </section>
          </div>

          <section className="fade-in-entry stagger-3 opacity-0 space-y-3 lg:col-span-3">
            <h2 className="text-lg font-extrabold text-primary">Actions rapides</h2>
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
                  <span className="text-xs font-bold text-onSurface">{action.label}</span>
                </Link>
              ))}
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}

