'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Button } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { updateCandidateProfile } from '@/lib/amud/candidateProfileService';
import type { CandidateAllemagne, GermanLevel } from '@/data/amud/candidateAccount';

const GERMAN_LEVELS: GermanLevel[] = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
const MOBILITES = ['Toute l’Allemagne', 'Régions spécifiques', 'Pas encore décidé'];
const DISPONIBILITES = ['Immédiate', 'Sous 1 mois', 'Sous 3 mois', 'Sous 6 mois'];

export default function ProfilAllemagnePage() {
  const { candidate, loading } = useCurrentCandidate();
  const notify = useToast();
  const [form, setForm] = useState<CandidateAllemagne>(() => candidate?.allemagne ?? {});
  const [metier, setMetier] = useState(candidate?.allemagne.metierRecherche ?? '');

  if (loading || !candidate) return null;

  function patch(p: Partial<CandidateAllemagne>) {
    setForm((f) => ({ ...f, ...p }));
  }

  function save() {
    updateCandidateProfile(candidate!.id, { allemagne: { ...form, metierRecherche: metier } }, { label: 'Profil Allemagne mis à jour' });
    notify('Profil Allemagne mis à jour', 'success');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <Link href="/amud/candidat/profil" className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour au profil
      </Link>

      <h1 className="mb-lg text-headline-md text-amud-on-surface">Profil Allemagne</h1>

      <div className="flex flex-col gap-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <div>
          <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Niveau d&apos;allemand actuel</p>
          <div className="flex flex-wrap gap-sm">
            {GERMAN_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => patch({ niveau: lvl })}
                className={`min-h-[44px] min-w-[52px] rounded-lg border px-md text-label-md font-semibold transition-colors ${
                  form.niveau === lvl ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Niveau visé</p>
          <div className="flex flex-wrap gap-sm">
            {GERMAN_LEVELS.map((lvl) => (
              <button
                key={lvl}
                type="button"
                onClick={() => patch({ niveauVise: lvl })}
                className={`min-h-[44px] min-w-[52px] rounded-lg border px-md text-label-md font-semibold transition-colors ${
                  form.niveauVise === lvl ? 'border-amud-primary bg-amud-primary text-white' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Métier recherché en Allemagne</span>
          <input
            value={metier}
            onChange={(e) => setMetier(e.target.value)}
            className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
          />
        </label>

        <div>
          <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Mobilité</p>
          <div className="flex flex-wrap gap-sm">
            {MOBILITES.map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => patch({ mobilite: m })}
                className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium transition-colors ${
                  form.mobilite === m ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
                }`}
              >
                {m}
              </button>
            ))}
          </div>
        </div>

        <div>
          <p className="mb-sm text-label-sm font-medium text-amud-on-surface-variant">Disponibilité</p>
          <div className="flex flex-wrap gap-sm">
            {DISPONIBILITES.map((d) => (
              <button
                key={d}
                type="button"
                onClick={() => patch({ disponibilite: d })}
                className={`min-h-[44px] rounded-lg border px-md text-label-md font-medium transition-colors ${
                  form.disponibilite === d ? 'border-amud-primary bg-amud-primary/10 text-amud-primary' : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
                }`}
              >
                {d}
              </button>
            ))}
          </div>
        </div>

        <label className="flex flex-col gap-1">
          <span className="text-label-sm font-medium text-amud-on-surface-variant">Préférences complémentaires</span>
          <textarea
            value={form.preferences ?? ''}
            onChange={(e) => patch({ preferences: e.target.value })}
            rows={3}
            placeholder="Ex. je préfère les villes du sud, disponible pour un déménagement rapide…"
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
          />
        </label>

        <Button onClick={save} className="self-start">
          Enregistrer
        </Button>
      </div>
    </div>
  );
}
