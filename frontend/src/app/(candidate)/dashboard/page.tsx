'use client';

// Interface 10 — Tableau de bord candidat.

import { useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/context/ProfileContext';
import { ChecklistItem } from '@/components/shared/ChecklistItem';
import { Button, IconButton } from '@/components/shared/Button';

const QUICK_ACTIONS = [
  { href: '/documents', label: 'Ajouter un document', icon: 'description' },
  { href: '/video', label: 'Enregistrer une vidéo', icon: 'videocam' },
  { href: '/test-langue', label: 'Passer le test de langue', icon: 'mic' },
  { href: '/profil', label: 'Voir mon profil public', icon: 'account_circle' },
  { href: '/cours-allemand', label: "Leçon d'allemand du jour", icon: 'translate' },
  { href: '/offres', label: "Voir les offres d'emploi", icon: 'work' },
  { href: '/simulateur-salaire', label: 'Simuler mon salaire', icon: 'calculate' },
  { href: '/visibilite', label: 'Ma visibilité', icon: 'insights' },
  { href: '/parrainage', label: 'Parrainer un ami', icon: 'group_add' },
  { href: '/verification-identite', label: 'Vérifier mon identité', icon: 'verified_user' },
  { href: '/matching-preferences', label: 'Préférences de matching', icon: 'tune' },
];

const APPLICATION_STAGES = ['Envoyée', 'Présélection', 'Entretien', 'Décision'];

const APPLICATIONS = [
  { id: 1, title: 'Infirmier Qualifié', company: 'Klinik Berlin', icon: 'medical_services', stage: 2, statusLabel: 'Entretien prévu', updatedAt: '18 août' },
  { id: 2, title: 'Électricien de Bâtiment', company: 'Elektro GmbH', icon: 'bolt', stage: 1, statusLabel: 'En présélection', updatedAt: '15 août' },
  { id: 3, title: 'Chauffeur PL', company: 'Logistik Nord', icon: 'local_shipping', stage: 0, statusLabel: 'Candidature envoyée', updatedAt: '12 août' },
] as const;

const RECOMMENDATIONS = [
  { id: 1, title: 'Réceptionniste', company: 'Hôtel München', icon: 'hotel', location: 'Munich, Allemagne', contract: 'CDI', match: 92 },
  { id: 2, title: 'Aide-Soignant', company: 'Pflegeheim Hamburg', icon: 'medical_services', location: 'Hambourg, Allemagne', contract: 'Plein temps', match: 87 },
] as const;

export default function DashboardPage() {
  const { profile } = useProfile();

  const cvDone = profile.documents.some((d) => d.type === 'cv');
  const diplomaDone = profile.documents.some((d) => d.type === 'diplome' || d.type === 'autre');
  const videoDone = Boolean(profile.videoUrl);
  const testDone = profile.testLangueScore !== null;
  const doneCount = [cvDone, diplomaDone, videoDone, testDone].filter(Boolean).length;
  const percent = 20 + doneCount * 20;

  const [appliedIds, setAppliedIds] = useState<number[]>([]);
  const heroApplication = [...APPLICATIONS].sort((a, b) => b.stage - a.stage)[0];
  const otherApplications = APPLICATIONS.filter((application) => application.id !== heroApplication.id);

  return (
    <div>
      <header className="sticky top-0 z-20 flex w-full items-center justify-between border-b border-surface-container-high bg-surface-container-lowest/90 px-6 py-3.5 backdrop-blur-md lg:px-10 lg:py-5">
        <div>
          <h1 className="text-base font-extrabold text-primary lg:text-xl">Bonjour, {profile.firstName || 'Candidat'} 👋</h1>
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
            {profile.avatarInitials || '—'}
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
                <span className="material-symbols-outlined fill animate-pulse text-primary" style={{ fontSize: 16 }}>
                  visibility
                </span>
                <span className="text-xs font-medium text-onSurface">
                  Profil visible par <span className="font-extrabold text-primary">12 recruteurs</span>
                </span>
              </div>
            </div>

            <section className="fade-in-entry stagger-2 opacity-0 space-y-3">
              <h2 className="text-lg font-extrabold text-primary">À compléter</h2>
              <div className="overflow-hidden rounded-pillar border border-outline-variant bg-surface-container-lowest shadow-subtle divide-y divide-surface-container-high">
                <ChecklistItem label="Profil personnel complété" status="done" />
                <ChecklistItem label="Secteur et qualification renseignés" status="done" />
                <ChecklistItem label="CV téléchargé" status={cvDone ? 'done' : 'pending'} href="/documents" actionLabel="Ajouter" />
                <ChecklistItem label="Certificats / diplômes" status={diplomaDone ? 'done' : 'pending'} href="/documents" actionLabel="Ajouter" />
                <ChecklistItem label="Vidéo de présentation" status={videoDone ? 'done' : 'pending'} href="/video" actionLabel="Enregistrer" />
                <ChecklistItem label="Test de langue" status={testDone ? 'done' : 'pending'} href="/test-langue" actionLabel="Passer le test" />
                <ChecklistItem
                  label="Identité vérifiée"
                  status={profile.identityVerified ? 'done' : 'pending'}
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

        <div className="space-y-6 lg:grid lg:grid-cols-5 lg:items-start lg:gap-8 lg:space-y-0">
          <section className="fade-in-entry stagger-4 opacity-0 space-y-3 lg:col-span-3">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-extrabold text-primary">Suivi des candidatures</h2>
              <Link href="/offres" className="text-xs font-bold text-primary hover:underline">
                Voir les offres
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
                    <h3 className="text-sm font-extrabold text-onSurface">{heroApplication.title}</h3>
                    <p className="text-xs font-medium text-onSurface-variant">{heroApplication.company}</p>
                  </div>
                </div>
                <span className="rounded-full bg-gold/15 px-3 py-1 text-[11px] font-bold text-tertiary">
                  {heroApplication.statusLabel}
                </span>
              </div>

              <div className="relative pb-1 pt-2">
                <div className="absolute left-[12%] right-[12%] top-[13px] h-0.5 bg-outline-variant" />
                <div
                  className="absolute left-[12%] top-[13px] h-0.5 bg-primary transition-all duration-500"
                  style={{ width: `${(heroApplication.stage / (APPLICATION_STAGES.length - 1)) * 76}%` }}
                />
                <div className="relative flex items-center justify-between">
                  {APPLICATION_STAGES.map((stage, i) => {
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
              <p className="mt-3 text-right text-[10px] text-onSurface-variant">Mise à jour le {heroApplication.updatedAt}</p>
            </div>

            {otherApplications.map((application) => (
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
                    <h4 className="text-sm font-bold text-onSurface">{application.title}</h4>
                    <p className="text-xs font-medium text-onSurface-variant">{application.company}</p>
                  </div>
                </div>
                <div className="text-right">
                  <span className="block text-xs font-bold text-onSurface">{application.statusLabel}</span>
                  <span className="text-[10px] text-outline">{application.updatedAt}</span>
                </div>
              </div>
            ))}
          </section>

          <section className="fade-in-entry stagger-4 opacity-0 space-y-3 lg:col-span-2">
            <h2 className="text-lg font-extrabold text-primary">Recommandations</h2>
            {RECOMMENDATIONS.map((offer) => {
              const applied = appliedIds.includes(offer.id);
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
                      {offer.match}% Match
                    </span>
                  </div>
                  <h3 className="text-sm font-extrabold text-onSurface">{offer.title}</h3>
                  <p className="mb-3 text-xs font-medium text-onSurface-variant">{offer.company}</p>
                  <div className="mb-4 flex flex-wrap gap-2">
                    {[offer.location, offer.contract].map((tag) => (
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
                    {applied ? 'Candidature envoyée' : 'Postuler'}
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

