'use client';

import { useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { addInterviewFeedback } from '@/lib/amud/interviewCascades';
import type { Interview } from '@/data/amud/interviews';
import type { Recommendation } from '@/data/amud/interviewFeedback';

const CRITERIA: { key: 'overall' | 'technical' | 'communication' | 'motivation' | 'cultureFit'; label: string }[] = [
  { key: 'overall', label: 'Évaluation globale' },
  { key: 'technical', label: 'Compétences techniques' },
  { key: 'communication', label: 'Communication' },
  { key: 'motivation', label: 'Motivation' },
  { key: 'cultureFit', label: 'Adéquation culturelle' },
];

const RECOMMENDATIONS: Recommendation[] = ['Fortement recommandé', 'Recommandé', 'À considérer', 'Non recommandé'];

function StarRating({ value, onChange, label }: { value: number; onChange: (v: number) => void; label: string }) {
  return (
    <div className="flex items-center justify-between gap-md">
      <span className="text-label-md text-amud-on-surface">{label}</span>
      <div className="flex items-center gap-0.5" role="radiogroup" aria-label={label}>
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            role="radio"
            aria-checked={value === n}
            aria-label={`${n} sur 5`}
            onClick={() => onChange(n)}
            className="p-0.5 text-amud-tertiary"
          >
            <span className="material-symbols-outlined text-[22px]" style={n <= value ? { fontVariationSettings: "'FILL' 1" } : undefined}>
              star
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

export function InterviewFeedbackForm({ interview, onSubmitted }: { interview: Interview; onSubmitted?: () => void }) {
  const notify = useToast();
  const [ratings, setRatings] = useState({ overall: 0, technical: 0, communication: 0, motivation: 0, cultureFit: 0 });
  const [recommendation, setRecommendation] = useState<Recommendation>('Recommandé');
  const [notes, setNotes] = useState('');

  const isValid = ratings.overall > 0 && ratings.technical > 0 && ratings.communication > 0 && ratings.motivation > 0 && ratings.cultureFit > 0;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!isValid) {
      notify('Merci de noter chaque critère avant d’enregistrer.', 'error');
      return;
    }
    addInterviewFeedback(interview, { authorNom: CURRENT_EMPLOYER.userNom, ...ratings, recommendation, notes: notes.trim() || undefined });
    notify('Évaluation enregistrée.');
    setRatings({ overall: 0, technical: 0, communication: 0, motivation: 0, cultureFit: 0 });
    setRecommendation('Recommandé');
    setNotes('');
    onSubmitted?.();
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
      <h3 className="text-title-lg text-amud-on-surface">Ajouter une évaluation</h3>
      {CRITERIA.map((c) => (
        <StarRating key={c.key} label={c.label} value={ratings[c.key]} onChange={(v) => setRatings((prev) => ({ ...prev, [c.key]: v }))} />
      ))}
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Recommandation</label>
        <select value={recommendation} onChange={(e) => setRecommendation(e.target.value as Recommendation)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
          {RECOMMENDATIONS.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Notes</label>
        <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <button type="submit" className="self-end rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110">
        Enregistrer l’évaluation
      </button>
    </form>
  );
}
