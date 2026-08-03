'use client';

// Interface 25 — Validation manuelle des profils.

import { useState } from 'react';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import { MOCK_ADMIN_USERS } from '@/lib/mockData';
import type { DocumentEntry } from '@/lib/types';

const PENDING_DOCS: DocumentEntry[] = [
  { id: 'pd1', type: 'cv', name: 'cv_salma_bennis.pdf', uploadedAt: '2026-07-20', status: 'en_attente' },
  { id: 'pd2', type: 'diplome', name: 'diplome_infirmiere.pdf', uploadedAt: '2026-07-20', status: 'en_attente' },
  { id: 'pd3', type: 'passeport', name: 'passeport_scan.jpg', uploadedAt: '2026-07-20', status: 'en_attente' },
];

export default function AdminValidationPage() {
  const pendingUsers = MOCK_ADMIN_USERS.filter((u) => u.status === 'en_attente');
  const [decisions, setDecisions] = useState<Record<string, 'valide' | 'rejete'>>({});
  const [isProcessing, setIsProcessing] = useState<string | null>(null);

  const handleDecision = async (userId: string, decision: 'valide' | 'rejete') => {
    setIsProcessing(userId);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setDecisions((prev) => ({ ...prev, [userId]: decision }));
    setIsProcessing(null);
  };

  return (
    <div className="mx-auto max-w-3xl p-6 md:p-8">
      <div className="mb-1 flex items-center gap-2">
        <h1 className="text-2xl font-bold text-primary">Validation des profils</h1>
        <span className="rounded-full bg-primary-light px-2.5 py-0.5 text-xs font-bold text-onPrimary-container">
          {pendingUsers.length}
        </span>
      </div>
      <p className="text-sm text-onSurface-variant">
        {pendingUsers.length} profil(s) en attente de vérification des pièces justificatives.
      </p>

      <div className="mt-4 flex items-center gap-2 rounded-lg bg-surface-low px-3 py-2 text-xs font-medium text-onSurface-variant">
        <span className="h-2 w-2 animate-pulse rounded-full bg-primary" />
        Synchronisation : mode en ligne
      </div>

      <div className="mt-6 space-y-5">
        {pendingUsers.map((user) => {
          const decision = decisions[user.id];
          return (
            <div key={user.id} className="rounded-xl border-l-4 border-primary bg-surface-lowest p-5 shadow-sm">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-primary-light text-sm font-bold text-primary">
                    {user.name.split(' ').map((n) => n[0]).slice(0, 2).join('')}
                  </div>
                  <div>
                    <h2 className="text-sm font-bold text-onSurface">{user.name}</h2>
                    <p className="text-xs text-onSurface-variant">{user.email}</p>
                    <p className="mt-0.5 text-[11px] italic text-outline">Soumis le {user.createdAt}</p>
                  </div>
                </div>
                {decision ? (
                  <span
                    className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ${
                      decision === 'valide' ? 'bg-primary-light text-onPrimary-container' : 'bg-error-light text-error'
                    }`}
                  >
                    {decision === 'valide' ? 'Validé' : 'Rejeté'}
                  </span>
                ) : (
                  <span className="flex shrink-0 items-center gap-1 rounded bg-surface-container px-2 py-1 text-primary">
                    <span className="material-symbols-outlined fill" style={{ fontSize: 14 }}>verified_user</span>
                    <span className="text-xs font-bold">OCR 98%</span>
                  </span>
                )}
              </div>

              <div className="mt-4 space-y-2.5">
                {PENDING_DOCS.map((doc) => (
                  <DocumentViewer key={doc.id} document={doc} />
                ))}
              </div>

              {!decision && (
                <div className="mt-4 grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleDecision(user.id, 'rejete')}
                    disabled={isProcessing === user.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg border border-error/30 py-2.5 text-xs font-bold text-error transition-colors hover:bg-error-light disabled:opacity-60"
                  >
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>cancel</span>
                    Rejeter
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDecision(user.id, 'valide')}
                    disabled={isProcessing === user.id}
                    className="flex flex-1 items-center justify-center gap-1.5 rounded-lg bg-primary py-2.5 text-xs font-bold text-onPrimary shadow-sm transition-opacity hover:opacity-90 disabled:opacity-60"
                  >
                    {isProcessing === user.id ? (
                      'Traitement…'
                    ) : (
                      <>
                        <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
                        Valider
                      </>
                    )}
                  </button>
                </div>
              )}
            </div>
          );
        })}

        {pendingUsers.length === 0 && (
          <p className="rounded-xl bg-surface-container p-6 text-center text-sm text-onSurface-variant">
            Aucun profil en attente.
          </p>
        )}
      </div>
    </div>
  );
}
