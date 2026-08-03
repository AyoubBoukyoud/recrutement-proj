'use client';

// Interface 21 (sous-page) — Mode swipe.

import { useState } from 'react';
import Link from 'next/link';
import { ChevronLeft, X, Heart, MapPin } from 'lucide-react';
import { useNetwork } from '@/context/NetworkContext';
import { MOCK_CANDIDATES } from '@/lib/mockData';

export default function SwipeMatchingsPage() {
  const { isOnline, queueAction } = useNetwork();
  const [index, setIndex] = useState(0);
  const [toast, setToast] = useState<string | null>(null);
  const candidate = MOCK_CANDIDATES[index];

  const handleDecision = (liked: boolean) => {
    if (liked && candidate) {
      if (!isOnline) queueAction('employer_interest', { candidateId: candidate.id });
      setToast('Intérêt exprimé !');
      setTimeout(() => setToast(null), 1500);
    }
    setIndex((i) => i + 1);
  };

  return (
    <div className="mx-auto max-w-md">
      <Link href="/employer/matchings" className="flex items-center gap-1 text-xs font-semibold text-onSurface-variant">
        <ChevronLeft size={14} /> Retour
      </Link>

      <div className="mt-6">
        {!candidate ? (
          <div className="rounded-2xl bg-surface-container p-10 text-center">
            <p className="text-sm font-semibold text-onSurface-variant">Vous avez parcouru tous les profils disponibles.</p>
            <button
              type="button"
              onClick={() => setIndex(0)}
              className="mt-4 rounded-xl bg-navy-900 px-4 py-2 text-xs font-bold text-white"
            >
              Recommencer
            </button>
          </div>
        ) : (
          <div className="relative rounded-3xl border border-gray-100 bg-white p-6 shadow-floating">
            <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-navy-900 text-2xl font-bold text-white">
              {candidate.avatarInitials}
            </div>
            <h2 className="mt-4 text-center text-lg font-bold text-navy-900">{candidate.name}</h2>
            <p className="text-center text-sm text-onSurface-variant">{candidate.role}</p>
            <p className="mt-1 flex items-center justify-center gap-1 text-xs text-gray-500">
              <MapPin size={11} /> {candidate.city} · {candidate.yearsExperience} ans d&apos;expérience
            </p>
            <div className="mt-4 flex justify-center gap-2">
              <span className="rounded-full bg-surface-container px-2.5 py-1 text-[11px] font-semibold text-onSurface-variant">
                {candidate.sector}
              </span>
              <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[11px] font-bold text-navy-900">
                {candidate.languageLevel}
              </span>
              <span className="rounded-full bg-amber-100 px-2.5 py-1 text-[11px] font-bold text-amber-700">
                {candidate.matchScore}% match
              </span>
            </div>

            <div className="mt-8 flex justify-center gap-6">
              <button
                type="button"
                onClick={() => handleDecision(false)}
                className="flex h-14 w-14 items-center justify-center rounded-full border-2 border-gray-200 text-gray-400 transition hover:border-red-300 hover:text-red-500"
                aria-label="Passer"
              >
                <X size={22} />
              </button>
              <button
                type="button"
                onClick={() => handleDecision(true)}
                className="flex h-14 w-14 items-center justify-center rounded-full bg-amber-500 text-white shadow-soft transition hover:bg-amber-600"
                aria-label="Exprimer un intérêt"
              >
                <Heart size={22} />
              </button>
            </div>
          </div>
        )}

        {toast && (
          <p className="mt-4 text-center text-xs font-semibold text-green-600">{toast}</p>
        )}
      </div>
    </div>
  );
}
