'use client';

import { useState } from 'react';
import { usePresentationAccess, useTrainingDemo } from '@/lib/amud/useTrainingDemo';
import { setTrainingDemo } from '@/lib/amud/trainingDemo';

export function TrainingDemoToggle() {
  const active = useTrainingDemo();
  const allowed = usePresentationAccess();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  async function toggle() {
    if (busy) return;
    setBusy(true); setError('');
    try {
      if (!active) {
        const { prepareTrainingDemo } = await import('@/lib/amud/prepareTrainingDemo');
        prepareTrainingDemo();
      }
      setTrainingDemo(!active);
    } catch {
      setError('Impossible de changer de mode. Autorisez le stockage du navigateur puis réessayez.');
    } finally { setBusy(false); }
  }

  // Only an administrator's verified presentation can switch to fictional data.
  if (!allowed) return null;
  return <div className="relative shrink-0">
    <button type="button" role="switch" aria-checked={active} aria-label="Données de démonstration du centre de formation" disabled={busy} onClick={() => void toggle()}
      title={active ? 'Désactiver les données de démonstration' : 'Remplir les espaces enseignant et centre avec des données de test'}
      className={`inline-flex min-h-11 items-center gap-2 rounded-full border px-3 text-label-sm font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary disabled:opacity-60 ${active ? 'border-amber-400 bg-amber-50 text-amber-900' : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'}`}>
      <span>{busy ? 'Chargement…' : active ? 'Démo active' : 'Données test'}</span>
      <span aria-hidden="true" className={`relative h-5 w-9 rounded-full transition-colors ${active ? 'bg-amber-600' : 'bg-amud-outline'}`}><span className={`absolute left-0 top-0.5 h-4 w-4 rounded-full bg-white shadow transition-transform ${active ? 'translate-x-[18px]' : 'translate-x-0.5'}`} /></span>
    </button>
    {error && <p role="alert" className="absolute right-0 top-full z-50 mt-2 w-64 rounded-lg border border-amud-error bg-amud-surface p-3 text-sm text-amud-error shadow-lg">{error}</p>}
  </div>;
}
