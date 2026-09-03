'use client';

// Page : Préférences de matching - Candidat
//
// Persisté dans `candidate_profiles.matching_preferences` (JSON), lu et écrit
// via PUT /candidate/profile — pas de table dédiée, rien d'autre ne consomme
// ces préférences aujourd'hui.

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useCandidateProfile, useInvalidateCandidateProfile } from '@/lib/useCandidateProfile';
import { candidateProfileRepository } from '@/data/candidateProfile';
import { Button } from '@/components/shared/Button';
import { ApiError } from '@/lib/api';
import { useLanguage } from '@/context/LanguageContext';
import {
  candidateMatchingPreferencesContentFor,
  regionLabelFor,
  sectorLabelFor,
} from '@/lib/candidateMatchingPreferencesContent';

// Valeurs canoniques (français) : servent de clés de comparaison (`includes`)
// et sont persistées telles quelles dans `matching_preferences` côté API.
// L'affichage traduit passe par `regionLabelFor` / `sectorLabelFor`.
const REGIONS = ['Berlin', 'Bavière', 'Hambourg', 'Saxe', 'Bade-Wurtemberg', 'Hesse'];
const ALL_SECTORS = ['Santé', 'Logistique', 'Électricité', 'Hôtellerie', 'Construction'];

export default function MatchingPreferencesPage() {
  const { language } = useLanguage();
  const content = candidateMatchingPreferencesContentFor(language);

  function messageOf(error: unknown, fallback: string): string {
    if (error instanceof ApiError) {
      if (error.isNetworkFailure) return content.errors.networkUnreachable;
      return error.message || fallback;
    }
    return fallback;
  }

  const { token } = useAuth();
  const { data: profile, isLoading } = useCandidateProfile();
  const invalidateProfile = useInvalidateCandidateProfile();

  const [regions, setRegions] = useState<string[]>([]);
  const [sectors, setSectors] = useState<string[]>([]);
  const [minSalary, setMinSalary] = useState(45000);
  const [savedToast, setSavedToast] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (!profile || hydrated) return;
    const prefs = profile.matching_preferences as { regions?: string[]; sectors?: string[]; min_salary?: number } | undefined;
    if (prefs) {
      setRegions(prefs.regions ?? []);
      setSectors(prefs.sectors ?? []);
      setMinSalary(prefs.min_salary ?? 45000);
    }
    setHydrated(true);
  }, [profile, hydrated]);

  const toggleRegion = (region: string) => {
    setRegions((prev) => (prev.includes(region) ? prev.filter((r) => r !== region) : [...prev, region]));
  };

  const removeSector = (sector: string) => setSectors((prev) => prev.filter((s) => s !== sector));
  const addSector = (sector: string) => setSectors((prev) => (prev.includes(sector) ? prev : [...prev, sector]));

  const handleSave = async () => {
    if (!token) return;
    setError(null);
    setIsSaving(true);

    try {
      await candidateProfileRepository.update(
        { matching_preferences: { regions, sectors, min_salary: minSalary } },
        token
      );
      await invalidateProfile();
      setSavedToast(true);
      setTimeout(() => setSavedToast(false), 3000);
    } catch (cause) {
      setError(messageOf(cause, content.errors.saveFailed));
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-background pb-32 text-onBackground font-sans">
      <header className="sticky top-0 z-40 w-full border-b border-outline-variant bg-surface">
        <div className="mx-auto flex h-16 w-full max-w-xl items-center justify-between px-1.5 lg:max-w-5xl lg:px-4">
          <div className="flex items-center gap-4">
            <Link
              href="/dashboard"
              aria-label={content.header.backAria}
              className="flex h-10 w-10 items-center justify-center rounded-full text-primary transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                arrow_back
              </span>
            </Link>
            <h1 className="text-lg font-bold text-primary">{content.header.title}</h1>
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/profil"
              aria-label={content.header.profileAria}
              className="flex h-10 w-10 items-center justify-center rounded-full text-onSurface-variant transition-colors hover:bg-surface-container-high active:scale-95"
            >
              <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
                account_circle
              </span>
            </Link>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-xl px-4 py-4 space-y-6 lg:max-w-5xl lg:px-10 lg:py-8">
        <div className="py-2">
          <h2 className="text-2xl font-extrabold text-onSurface">{content.intro.title}</h2>
          <p className="mt-1 text-sm font-medium leading-relaxed text-onSurface-variant">{content.intro.body}</p>
        </div>

        {isLoading ? (
          <p className="helper-text">{content.loading}</p>
        ) : (
        <div className="space-y-6 lg:grid lg:grid-cols-2 lg:items-start lg:gap-6 lg:space-y-0">
        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              map
            </span>
            {content.regionsSection.title}
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
            {REGIONS.map((regionName) => (
              <label
                key={regionName}
                className="group flex cursor-pointer items-center justify-between rounded-lg border border-outline-variant p-3.5 transition-colors hover:bg-surface-container-low"
              >
                <span className="text-sm font-semibold text-onSurface">{regionLabelFor(content, regionName)}</span>
                <input
                  type="checkbox"
                  checked={regions.includes(regionName)}
                  onChange={() => toggleRegion(regionName)}
                  className="h-5 w-5 rounded border-outline text-primary focus:ring-primary"
                />
              </label>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              category
            </span>
            {content.sectorsSection.title}
          </h3>
          <div className="flex flex-wrap gap-2 pt-1">
            {sectors.map((sec) => (
              <div
                key={sec}
                className="flex items-center gap-1.5 rounded-full border border-primary/30 bg-surface-container-high px-4 py-2 text-xs font-bold text-primary shadow-xs"
              >
                <span>{sectorLabelFor(content, sec)}</span>
                <button
                  type="button"
                  onClick={() => removeSector(sec)}
                  aria-label={`${content.sectorsSection.removeAriaPrefix} ${sectorLabelFor(content, sec)}`}
                  className="-m-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full hover:opacity-75"
                >
                  <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
                    close
                  </span>
                </button>
              </div>
            ))}
            {ALL_SECTORS.filter((s) => !sectors.includes(s)).map((sec) => (
              <Button
                key={sec}
                variant="outline"
                size="sm"
                pill
                onClick={() => addSector(sec)}
                className="gap-1.5 border-outline-variant text-onSurface-variant"
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  add
                </span>
                {sectorLabelFor(content, sec)}
              </Button>
            ))}
          </div>
        </section>

        <section className="rounded-xl border border-outline-variant border-l-4 border-l-primary bg-surface-container-lowest p-6 shadow-subtle space-y-4 lg:col-span-2">
          <h3 className="flex items-center gap-2 text-base font-extrabold text-primary">
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              payments
            </span>
            {content.salarySection.title}
          </h3>
          <div className="relative mt-2">
            <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-4 text-base font-extrabold text-onSurface-variant">
              €
            </span>
            <input
              type="number"
              step="1000"
              aria-label={content.salarySection.title}
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              placeholder="45,000"
              className="w-full rounded-lg border border-outline bg-surface py-3 pl-10 pr-4 text-xl font-extrabold text-onSurface outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 shadow-sm"
            />
          </div>
          <div className="pt-2">
            <input
              type="range"
              min="30000"
              max="120000"
              step="5000"
              aria-label={content.salarySection.title}
              value={minSalary}
              onChange={(e) => setMinSalary(Number(e.target.value))}
              className="h-2 w-full cursor-pointer appearance-none rounded-lg bg-surface-container accent-primary"
            />
            <div className="mt-2 flex justify-between text-xs font-bold text-onSurface-variant">
              <span>30k €</span>
              <span>120k €</span>
            </div>
          </div>
        </section>
        </div>
        )}

        {error && <p className="text-sm font-medium text-error">{error}</p>}

        {savedToast && (
          <div className="flex items-center gap-2 rounded-pillar bg-primary-container p-4 text-xs font-bold text-onPrimary shadow-md animate-pulse">
            <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
              check_circle
            </span>
            {content.savedToast}
          </div>
        )}

        <div className="pt-4 pb-8 flex justify-center">
          <Button
            size="lg"
            fullWidth
            onClick={() => void handleSave()}
            disabled={isSaving || isLoading}
            isLoading={isSaving}
            loadingLabel={content.saveButton.loadingLabel}
            className="text-base font-extrabold shadow-lg lg:max-w-sm"
          >
            <span>{content.saveButton.label}</span>
            <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
              save
            </span>
          </Button>
        </div>
      </main>
    </div>
  );
}
