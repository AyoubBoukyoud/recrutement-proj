'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { saveOnboardingStep } from '@/lib/amud/candidateProfileService';
import { generateId } from '@/lib/amud/storage/ids';
import { ONBOARDING_STEPS, type CandidateAccount, type CandidateLangue, type GermanLevel } from '@/data/amud/candidateAccount';

const GERMAN_LEVELS: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const SITUATIONS = ['En recherche active', 'En veille', 'En poste, ouvert aux opportunités', 'Étudiant(e)'];
const DOMAINES = ['Santé', 'BTP', 'Informatique', 'Hôtellerie & Restauration', 'Industrie', 'Logistique', 'Autre'];
const EXPERIENCES = ['Débutant', '1-3 ans', '3-5 ans', '5-10 ans', '10+ ans'];
const CONTRATS = ['CDI', 'CDD', 'Alternance', 'Stage', 'Intérim'];
const TELETRAVAIL = ['Présentiel', 'Hybride', 'Télétravail complet'];

const STEP_LABELS = ['Situation', 'Domaine', 'Métier', 'Expérience', 'Langues', 'Allemand', 'Préférences'];

export default function OnboardingPage() {
  const router = useRouter();
  const notify = useToast();
  const { candidate, loading } = useCurrentCandidate();
  const [stepIndex, setStepIndex] = useState(0);
  const [draft, setDraft] = useState<Partial<CandidateAccount>>({});
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    if (loading) return;
    if (!candidate) {
      router.replace('/amud/candidat/inscription');
      return;
    }
    if (!initialized) {
      setStepIndex(Math.min(candidate.onboarding.step, ONBOARDING_STEPS.length - 1));
      setDraft({
        situation: candidate.situation,
        domaine: candidate.domaine,
        metier: candidate.metier,
        posteRecherche: candidate.posteRecherche,
        experienceAnnees: candidate.experienceAnnees,
        langues: candidate.langues,
        allemagne: candidate.allemagne,
        preferencesPro: candidate.preferencesPro,
      });
      setInitialized(true);
    }
  }, [loading, candidate, initialized, router]);

  const percent = useMemo(() => Math.round(((stepIndex + 1) / ONBOARDING_STEPS.length) * 100), [stepIndex]);

  if (loading || !candidate || !initialized) {
    return <div className="mx-auto max-w-lg py-xl text-center text-body-md text-amud-on-surface-variant">Chargement…</div>;
  }

  function patch(p: Partial<CandidateAccount>) {
    setDraft((d) => ({ ...d, ...p }));
  }

  function goNext() {
    const nextIndex = Math.min(stepIndex + 1, ONBOARDING_STEPS.length - 1);
    saveOnboardingStep(candidate!.id, stepIndex, draft);
    if (stepIndex >= ONBOARDING_STEPS.length - 1) {
      notify('Profil de base complété — vous pouvez maintenant compléter vos expériences et formations.', 'success');
      router.push('/amud/candidat');
      return;
    }
    setStepIndex(nextIndex);
  }

  function goBack() {
    setStepIndex((s) => Math.max(0, s - 1));
  }

  const isLast = stepIndex === ONBOARDING_STEPS.length - 1;

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-lg flex-col justify-center px-margin-mobile py-xl">
      <div className="mb-lg">
        <div className="mb-1 flex items-center justify-between text-label-sm text-amud-on-surface-variant">
          <span>
            Étape {stepIndex + 1} / {ONBOARDING_STEPS.length} — {STEP_LABELS[stepIndex]}
          </span>
          <span>{percent}%</span>
        </div>
        <div className="h-2 w-full overflow-hidden rounded-full bg-amud-surface-container-high">
          <div className="h-full rounded-full bg-amud-primary transition-all duration-300" style={{ width: `${percent}%` }} />
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        {stepIndex === 0 ? <SituationStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 1 ? <DomaineStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 2 ? <MetierStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 3 ? <ExperienceStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 4 ? <LanguesStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 5 ? <AllemandStep draft={draft} onChange={patch} /> : null}
        {stepIndex === 6 ? <PreferencesStep draft={draft} onChange={patch} /> : null}
      </div>

      <div className="mt-lg flex items-center justify-between gap-sm">
        <Button variant="secondary" onClick={goBack} disabled={stepIndex === 0}>
          Précédent
        </Button>
        <Button onClick={goNext} icon={isLast ? 'check' : 'arrow_forward'}>
          {isLast ? 'Terminer' : 'Suivant'}
        </Button>
      </div>
    </div>
  );
}

function OptionGrid<T extends string>({ options, value, onSelect }: { options: T[]; value?: T; onSelect: (v: T) => void }) {
  return (
    <div className="flex flex-col gap-sm">
      {options.map((o) => (
        <button
          key={o}
          type="button"
          onClick={() => onSelect(o)}
          className={`flex min-h-[44px] items-center justify-between rounded-lg border px-md py-2 text-left text-body-md transition-colors ${
            value === o ? 'border-amud-primary bg-amud-primary/10 text-amud-primary font-medium' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
          }`}
        >
          {o}
          {value === o ? <span className="material-symbols-outlined text-[20px]">check_circle</span> : null}
        </button>
      ))}
    </div>
  );
}

function SituationStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Quelle est votre situation actuelle ?</h2>
      <OptionGrid options={SITUATIONS} value={draft.situation} onSelect={(v) => onChange({ situation: v })} />
    </div>
  );
}

function DomaineStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Dans quel domaine recherchez-vous ?</h2>
      <OptionGrid options={DOMAINES} value={draft.domaine} onSelect={(v) => onChange({ domaine: v })} />
    </div>
  );
}

function MetierStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Quel métier recherchez-vous ?</h2>
      <input
        value={draft.metier ?? ''}
        onChange={(e) => onChange({ metier: e.target.value, posteRecherche: e.target.value })}
        placeholder="Ex. Infirmier, Développeur, Chef de chantier…"
        className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
      />
    </div>
  );
}

function ExperienceStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Quelle est votre expérience ?</h2>
      <OptionGrid options={EXPERIENCES} value={draft.experienceAnnees} onSelect={(v) => onChange({ experienceAnnees: v })} />
    </div>
  );
}

function LanguesStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  const langues = draft.langues ?? [];
  function addLangue() {
    const next: CandidateLangue[] = [...langues, { id: generateId('langue'), langue: '', niveau: 'Intermédiaire' }];
    onChange({ langues: next });
  }
  function updateLangue(id: string, patch: Partial<CandidateLangue>) {
    onChange({ langues: langues.map((l) => (l.id === id ? { ...l, ...patch } : l)) });
  }
  function removeLangue(id: string) {
    onChange({ langues: langues.filter((l) => l.id !== id) });
  }

  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Quelles langues parlez-vous ?</h2>
      <div className="flex flex-col gap-sm">
        {langues.map((l) => (
          <div key={l.id} className="flex items-center gap-sm">
            <input
              value={l.langue}
              onChange={(e) => updateLangue(l.id, { langue: e.target.value })}
              placeholder="Langue"
              className="min-h-[44px] flex-1 rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            />
            <select
              value={l.niveau}
              onChange={(e) => updateLangue(l.id, { niveau: e.target.value })}
              className="min-h-[44px] rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            >
              <option>Notions</option>
              <option>Intermédiaire</option>
              <option>Courant</option>
              <option>Bilingue</option>
            </select>
            <button type="button" onClick={() => removeLangue(l.id)} aria-label="Supprimer" className="flex h-11 w-11 items-center justify-center rounded-full text-amud-error hover:bg-amud-error-container">
              <span className="material-symbols-outlined text-[20px]">delete</span>
            </button>
          </div>
        ))}
      </div>
      <button type="button" onClick={addLangue} className="mt-md flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">add</span>
        Ajouter une langue
      </button>
    </div>
  );
}

function AllemandStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  const allemagne = draft.allemagne ?? {};
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Votre niveau d&apos;allemand</h2>
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Niveau actuel</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {GERMAN_LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange({ allemagne: { ...allemagne, niveau: lvl } })}
            className={`min-h-[44px] min-w-[52px] rounded-lg border px-md text-label-md font-semibold transition-colors ${
              allemagne.niveau === lvl ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Niveau visé</p>
      <div className="flex flex-wrap gap-sm">
        {GERMAN_LEVELS.map((lvl) => (
          <button
            key={lvl}
            type="button"
            onClick={() => onChange({ allemagne: { ...allemagne, niveauVise: lvl } })}
            className={`min-h-[44px] min-w-[52px] rounded-lg border px-md text-label-md font-semibold transition-colors ${
              allemagne.niveauVise === lvl ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {lvl}
          </button>
        ))}
      </div>
    </div>
  );
}

function PreferencesStep({ draft, onChange }: { draft: Partial<CandidateAccount>; onChange: (p: Partial<CandidateAccount>) => void }) {
  const prefs = draft.preferencesPro ?? {};
  return (
    <div>
      <h2 className="mb-md text-title-lg text-amud-on-surface">Vos préférences professionnelles</h2>
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Type de contrat</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {CONTRATS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange({ preferencesPro: { ...prefs, contrat: c } })}
            className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium transition-colors ${
              prefs.contrat === c ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {c}
          </button>
        ))}
      </div>
      <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Télétravail</p>
      <div className="mb-md flex flex-wrap gap-sm">
        {TELETRAVAIL.map((t) => (
          <button
            key={t}
            type="button"
            onClick={() => onChange({ preferencesPro: { ...prefs, teletravail: t } })}
            className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium transition-colors ${
              prefs.teletravail === t ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
            }`}
          >
            {t}
          </button>
        ))}
      </div>
      <label className="flex flex-col gap-1">
        <span className="text-label-sm font-medium text-amud-on-surface-variant">Salaire minimum souhaité (MAD/mois)</span>
        <input
          type="number"
          value={prefs.salaireMin ?? ''}
          onChange={(e) => onChange({ preferencesPro: { ...prefs, salaireMin: e.target.value ? Number(e.target.value) : undefined } })}
          className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
        />
      </label>
    </div>
  );
}
