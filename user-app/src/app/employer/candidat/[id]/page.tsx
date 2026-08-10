'use client';

// Interface 20 — Fiche candidat détaillée (accessible depuis recherche, dashboard, matchings).

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useNetwork } from '@/context/NetworkContext';
import { CEFRGauge } from '@/components/shared/CEFRGauge';
import { VideoPlayer } from '@/components/shared/VideoPlayer';
import { MOCK_CANDIDATES, CEFR_LEVELS } from '@/lib/mockData';

export default function CandidateDetailPage({ params }: { params: { id: string } }) {
  const router = useRouter();
  const { isOnline, queueAction } = useNetwork();
  const candidate = MOCK_CANDIDATES.find((c) => c.id === params.id);
  const [mutualInterest, setMutualInterest] = useState(candidate?.mutualInterest ?? false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [notes, setNotes] = useState('');

  if (!candidate) {
    return (
      <div className="mx-auto max-w-2xl p-6">
        <Link href="/employer/recherche" className="text-xs font-semibold text-onSurface-variant">← Retour</Link>
        <p className="mt-6 rounded-xl bg-surface-container p-6 text-center text-sm text-onSurface-variant">
          Candidat introuvable.
        </p>
      </div>
    );
  }

  const level = CEFR_LEVELS[Math.min(CEFR_LEVELS.length - 1, Math.floor((candidate.matchScore / 100) * CEFR_LEVELS.length))];

  const handlePrimaryAction = async () => {
    if (mutualInterest) {
      router.push(`/employer/messagerie?candidat=${candidate.id}`);
      return;
    }
    setIsSubmitting(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    if (!isOnline) {
      queueAction('employer_interest', { candidateId: candidate.id });
    }
    setMutualInterest(true);
    setIsSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-surface pb-28">
      <header className="flex h-16 items-center justify-between border-b border-outline-variant bg-surface px-6 md:px-8">
        <Link href="/employer/recherche" className="flex items-center gap-2 text-primary transition-colors hover:bg-surface-container">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
          <span className="text-lg font-bold text-onSurface">Candidate Profile</span>
        </Link>
        <span className="hidden items-center gap-1 rounded-full bg-gold-light px-3 py-1 text-sm font-bold text-gold-dark md:inline-flex">
          <span className="material-symbols-outlined" style={{ fontSize: 16 }}>stars</span>
          {candidate.matchScore}% Match
        </span>
      </header>

      <main className="mx-auto max-w-[1200px] space-y-6 p-6 md:p-8">
        <section className="grid grid-cols-1 gap-6 md:grid-cols-12 md:items-start">
          <div className="md:col-span-3">
            <div className="relative">
              <div className="flex aspect-square items-center justify-center rounded-2xl border-4 border-surface-lowest bg-primary-light text-5xl font-bold text-primary shadow-xl">
                {candidate.avatarInitials}
              </div>
              <div className="absolute -bottom-3 -right-3 rounded-full bg-surface-lowest p-1 shadow-lg">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary text-onPrimary">
                  <span className="material-symbols-outlined fill" style={{ fontSize: 20 }}>check_circle</span>
                </div>
              </div>
            </div>
          </div>
          <div className="flex flex-col justify-center md:col-span-9">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <h1 className="text-3xl font-bold text-onSurface">{candidate.name}</h1>
              {candidate.status === 'nouveau' && (
                <span className="rounded-full bg-primary px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-onPrimary">
                  Disponible
                </span>
              )}
            </div>
            <p className="mb-4 text-lg text-onSurface-variant">{candidate.role} · {candidate.yearsExperience} ans · {candidate.city}, Maroc</p>
            <div className="flex flex-wrap gap-3">
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-high px-4 py-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>work_history</span>
                <span className="text-sm text-onSurface">{candidate.yearsExperience} ans d&apos;expérience</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-outline-variant bg-surface-high px-4 py-2">
                <span className="material-symbols-outlined text-primary" style={{ fontSize: 18 }}>verified_user</span>
                <span className="text-sm text-onSurface">Documents vérifiés</span>
              </div>
              <div className="flex items-center gap-2 rounded-xl border border-gold/30 bg-gold-light px-4 py-2 md:hidden">
                <span className="material-symbols-outlined text-gold-dark" style={{ fontSize: 18 }}>stars</span>
                <span className="text-sm font-bold text-gold-dark">{candidate.matchScore}% Match</span>
              </div>
            </div>
          </div>
        </section>

        <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
          <div className="space-y-6 md:col-span-7 lg:col-span-8">
            <article className="space-y-3 rounded-xl border-l-4 border-primary bg-surface-lowest p-6 shadow-sm">
              <div className="flex items-center gap-2 text-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>auto_awesome</span>
                <h4 className="text-lg font-bold">Résumé du candidat</h4>
              </div>
              <p className="text-sm leading-relaxed text-onSurface-variant">
                {candidate.name.split(' ')[0]} est un{candidate.role.match(/^[AEIOUaeiou]/) ? '' : '(e)'} {candidate.role.toLowerCase()} avec {candidate.yearsExperience} ans d&apos;expérience
                dans le secteur {candidate.sector}. Niveau d&apos;allemand estimé : {candidate.languageLevel}, ce qui le/la prépare bien pour une intégration
                rapide en entreprise allemande. Statut actuel du dossier : {candidate.status}.
              </p>
            </article>

            <article className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h4 className="text-lg font-bold text-onSurface">Vidéo de présentation</h4>
              </div>
              <VideoPlayer src={null} />
            </article>

            <article className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-sm">
              <h4 className="text-lg font-bold text-onSurface">Profil professionnel</h4>
              <div className="flex gap-4">
                <div className="mt-1 h-3 w-3 shrink-0 rounded-full border-4 border-surface-lowest bg-primary-light shadow-sm" />
                <div>
                  <p className="font-bold text-onSurface">{candidate.role}</p>
                  <p className="text-sm text-onSurface-variant">{candidate.sector} · {candidate.city}</p>
                  <p className="mt-2 text-sm text-onSurface-variant">
                    {candidate.yearsExperience} ans d&apos;expérience cumulée dans ce secteur, statut de candidature : {candidate.status}.
                  </p>
                </div>
              </div>
            </article>
          </div>

          <div className="space-y-6 md:col-span-5 lg:col-span-4">
            <article className="space-y-4 rounded-xl bg-surface-lowest p-6 shadow-sm">
              <h4 className="text-lg font-bold text-onSurface">Compétences linguistiques</h4>
              <CEFRGauge label={`Allemand (estimé)`} level={level} />
              <div className="flex items-center justify-between text-sm">
                <span className="font-bold text-onSurface">Niveau déclaré</span>
                <span className="font-bold text-primary">{candidate.languageLevel}</span>
              </div>
            </article>

            <article className="space-y-3 rounded-xl border border-dashed border-outline bg-surface-highest/30 p-6">
              <div className="flex items-center gap-3 text-onSurface">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }}>lock</span>
                <h4 className="text-sm font-bold uppercase tracking-wider">Confidentialité</h4>
              </div>
              <div className="space-y-3">
                <div className="rounded-lg bg-surface-lowest/60 p-3">
                  <p className="mb-1 text-xs text-onSurface-variant">Nom complet</p>
                  <p className={`font-bold ${mutualInterest ? '' : 'select-none blur-[3px]'}`}>{candidate.name}</p>
                </div>
                <div className="rounded-lg bg-surface-lowest/60 p-3">
                  <p className="mb-1 text-xs text-onSurface-variant">Téléphone</p>
                  <p className={`font-bold ${mutualInterest ? '' : 'select-none blur-[3px]'}`}>
                    {mutualInterest ? '+212 6XX-XXXXXX' : '+212 6XX-XXXXXX'}
                  </p>
                </div>
                <p className="pt-2 text-center text-xs font-bold italic text-primary">
                  {mutualInterest ? 'Visible — intérêt mutuel confirmé' : 'Visible après intérêt mutuel'}
                </p>
              </div>
            </article>

            <article className="space-y-3 rounded-xl bg-surface-low p-6">
              <div className="flex items-center gap-2 text-onSurface-variant">
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>sticky_note_2</span>
                <label htmlFor="recruiter-notes" className="text-xs font-bold uppercase tracking-tight">Notes privées</label>
              </div>
              <textarea
                id="recruiter-notes"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Notes visibles uniquement par vous…"
                className="min-h-[100px] w-full resize-none rounded-lg border border-outline-variant bg-surface-lowest p-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </article>
          </div>
        </div>
      </main>

      <div className="fixed bottom-0 left-0 z-30 flex w-full items-center justify-between gap-4 border-t border-outline-variant bg-surface-lowest/90 px-6 py-4 backdrop-blur-md md:left-64 md:w-[calc(100%-16rem)]">
        <div className="flex gap-2">
          <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant text-onSurface-variant transition-colors hover:bg-surface-high hover:text-secondary active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>favorite</span>
          </button>
          <button className="flex h-12 w-12 items-center justify-center rounded-xl border border-outline-variant text-onSurface-variant transition-colors hover:bg-surface-high hover:text-primary active:scale-95">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>create_new_folder</span>
          </button>
        </div>
        <button
          type="button"
          onClick={handlePrimaryAction}
          disabled={isSubmitting}
          className="h-12 max-w-md flex-1 rounded-xl bg-gold text-sm font-bold text-onGold shadow-lg shadow-gold/20 transition-all hover:brightness-95 active:scale-[0.98] disabled:opacity-60"
        >
          <span className="flex items-center justify-center gap-2">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              {mutualInterest ? 'chat' : 'send'}
            </span>
            {isSubmitting ? 'Envoi…' : mutualInterest ? 'Contacter' : 'Exprimer un intérêt'}
          </span>
        </button>
      </div>
    </div>
  );
}
