'use client';

// Interface 11 — Ajout de documents & CV.

import { useState } from 'react';
import Link from 'next/link';
import { useProfile } from '@/context/ProfileContext';
import { useNetwork } from '@/context/NetworkContext';
import { DocumentViewer } from '@/components/shared/DocumentViewer';
import type { DocumentEntry } from '@/lib/types';

const DOC_TYPES: { type: DocumentEntry['type']; label: string }[] = [
  { type: 'cv', label: 'CV' },
  { type: 'diplome', label: 'Diplôme' },
  { type: 'passeport', label: 'Passeport' },
  { type: 'autre', label: 'Autre' },
];

type FlowState = 'idle' | 'scanning' | 'ready';

export default function DocumentsPage() {
  const { profile, updateProfile } = useProfile();
  const { isOnline, queueAction } = useNetwork();
  const [selectedType, setSelectedType] = useState<DocumentEntry['type']>('cv');
  const [flowState, setFlowState] = useState<FlowState>('idle');
  const [draftName, setDraftName] = useState('');
  const [draftFullName, setDraftFullName] = useState('');
  const [draftInstitution, setDraftInstitution] = useState('');
  const [draftYear, setDraftYear] = useState('');
  const [scanProgress, setScanProgress] = useState(0);
  const [toast, setToast] = useState<string | null>(null);

  const startScan = () => {
    setFlowState('scanning');
    setScanProgress(0);
    setDraftName(`${selectedType}_${profile.firstName || 'candidat'}.pdf`);
    setDraftFullName(`${profile.firstName} ${profile.lastName}`.trim());
    setDraftInstitution('');
    setDraftYear('');

    const interval = setInterval(() => {
      setScanProgress((p) => {
        if (p >= 100) {
          clearInterval(interval);
          setFlowState('ready');
          return 100;
        }
        return p + 8;
      });
    }, 150);
  };

  const confirmUpload = () => {
    const doc: DocumentEntry = {
      id: `doc_${Date.now()}`,
      type: selectedType,
      name: draftName,
      uploadedAt: new Date().toISOString(),
      status: isOnline ? 'valide' : 'en_attente',
    };
    updateProfile({ documents: [...profile.documents, doc] });

    if (!isOnline) {
      queueAction('upload_document', { document: doc });
      setToast("Document mis en file d'attente — synchronisation dès la reconnexion.");
    } else {
      setToast('Document ajouté avec succès.');
    }

    setFlowState('idle');
    setTimeout(() => setToast(null), 3000);
  };

  const handleRemove = (id: string) => {
    updateProfile({ documents: profile.documents.filter((d) => d.id !== id) });
  };

  return (
    <div className="min-h-screen bg-surface pb-24">
      <header className="sticky top-0 z-10 flex items-center gap-3 border-b border-outline-variant/30 bg-surface/90 px-6 py-4 backdrop-blur-md">
        <Link href="/dashboard" className="text-primary-dark transition-opacity hover:opacity-80">
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>arrow_back</span>
        </Link>
        <h1 className="text-lg font-bold text-primary-dark">Ajouter un document</h1>
      </header>

      <main className="mx-auto max-w-xl space-y-6 px-6 pt-6">
        <section>
          <div className="flex justify-between gap-1 overflow-x-auto rounded-xl bg-surface-container p-1">
            {DOC_TYPES.map(({ type, label }) => (
              <button
                key={type}
                type="button"
                onClick={() => setSelectedType(type)}
                className={`flex-1 whitespace-nowrap rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                  selectedType === type ? 'bg-primary-container text-on-primary' : 'text-onSurface-variant hover:bg-surface-container-lowest/60'
                }`}
              >
                {label}
              </button>
            ))}
          </div>
        </section>

        {flowState === 'idle' && (
          <section>
            <button
              type="button"
              onClick={startScan}
              className="group flex w-full flex-col items-center gap-4 rounded-2xl border-2 border-dashed border-outline-variant bg-surface-container-lowest p-10 text-center transition-colors hover:border-primary-container hover:bg-surface-container-low"
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface-container text-primary-container transition-transform group-hover:scale-110">
                <span className="material-symbols-outlined" style={{ fontSize: 30 }}>upload_file</span>
              </div>
              <div>
                <h3 className="text-base font-semibold text-onSurface">Prenez une photo ou importez un fichier</h3>
                <p className="text-sm text-outline">PDF, JPG, PNG — Max 10 Mo</p>
              </div>
            </button>
            <div className="mt-4 grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={startScan}
                className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 px-4 font-medium transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: 20 }}>photo_camera</span>
                Prendre une photo
              </button>
              <button
                type="button"
                onClick={startScan}
                className="flex items-center justify-center gap-2 rounded-xl border border-outline-variant py-3 px-4 font-medium transition-colors hover:bg-surface-container"
              >
                <span className="material-symbols-outlined text-primary-container" style={{ fontSize: 20 }}>image</span>
                Importer
              </button>
            </div>
          </section>
        )}

        {flowState === 'scanning' && (
          <section className="space-y-4">
            <div className="relative flex aspect-[4/3] w-full items-center justify-center overflow-hidden rounded-2xl border border-outline-variant bg-surface-container-lowest shadow-lg">
              <div className="absolute inset-x-0 top-0 h-1 animate-[scan_1.8s_ease-in-out_infinite] bg-gradient-to-r from-transparent via-primary-container to-transparent shadow-[0_0_15px_2px_rgba(27,94,55,0.5)]" />
              <div className="absolute inset-0 flex items-center justify-center bg-primary-container/10">
                <div className="rounded-full bg-surface-container-lowest/90 px-6 py-2 shadow-sm backdrop-blur-sm">
                  <span className="font-medium text-primary-container">Numérisation…</span>
                </div>
              </div>
              <div className="flex flex-col items-center gap-2 text-primary-container">
                <span className="material-symbols-outlined animate-pulse" style={{ fontSize: 40 }}>document_scanner</span>
              </div>
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-sm font-medium text-onSurface-variant">
                <span>Analyse du document en cours…</span>
                <span>{scanProgress}%</span>
              </div>
              <div className="h-2 w-full overflow-hidden rounded-full bg-surface-container">
                <div
                  className="h-full rounded-full bg-primary-container transition-all duration-150"
                  style={{ width: `${scanProgress}%` }}
                />
              </div>
            </div>
          </section>
        )}

        {flowState === 'ready' && (
          <section className="rounded-2xl border border-surface-container-high bg-surface-container-lowest p-6 shadow-[0px_4px_20px_rgba(0,0,0,0.03)]">
            <div className="mb-6 flex items-center justify-between">
              <span className="flex items-center gap-1 rounded-full bg-primary-container/10 px-3 py-1 text-xs font-bold text-primary-container">
                <span className="material-symbols-outlined" style={{ fontSize: 14 }}>check_circle</span> Succès
              </span>
              <span className="text-xs text-outline">Analyse IA terminée</span>
            </div>

            {selectedType === 'diplome' ? (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Nom complet</label>
                  <input
                    value={draftFullName}
                    onChange={(e) => setDraftFullName(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Institution</label>
                  <input
                    value={draftInstitution}
                    onChange={(e) => setDraftInstitution(e.target.value)}
                    placeholder="Nom de l'établissement"
                    className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-container"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Année</label>
                    <input
                      value={draftYear}
                      onChange={(e) => setDraftYear(e.target.value)}
                      placeholder={String(new Date().getFullYear())}
                      className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-container"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Type</label>
                    <input
                      disabled
                      value={DOC_TYPES.find((d) => d.type === selectedType)?.label ?? ''}
                      className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm font-medium text-onSurface-variant"
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Nom du fichier</label>
                  <input
                    value={draftName}
                    onChange={(e) => setDraftName(e.target.value)}
                    className="w-full rounded-xl border border-outline-variant bg-surface px-3 py-2.5 text-sm font-medium outline-none focus:border-primary-container"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">Type de document</label>
                  <input
                    disabled
                    value={DOC_TYPES.find((d) => d.type === selectedType)?.label ?? ''}
                    className="w-full rounded-xl border border-outline-variant bg-surface-container-low px-3 py-2.5 text-sm font-medium text-onSurface-variant"
                  />
                </div>
              </div>
            )}

            <button
              type="button"
              onClick={confirmUpload}
              className="mt-6 w-full rounded-xl bg-primary-container py-4 text-sm font-bold text-on-primary shadow-sm transition-all hover:opacity-90 active:scale-[0.98]"
            >
              Confirmer et enregistrer
            </button>
          </section>
        )}

        {toast && (
          <div className="flex items-center gap-2 rounded-xl bg-primary-container/10 p-3 text-xs font-semibold text-primary-container">
            <span className="material-symbols-outlined" style={{ fontSize: 16 }}>check_circle</span>
            {toast}
          </div>
        )}

        <section className="space-y-3 pb-6">
          <h2 className="px-1 text-lg font-bold text-onSurface">Documents importés ({profile.documents.length})</h2>
          {profile.documents.length === 0 ? (
            <p className="rounded-xl bg-surface-container p-4 text-center text-sm text-onSurface-variant">
              Aucun document pour le moment.
            </p>
          ) : (
            <div className="space-y-2.5">
              {profile.documents.map((doc) => (
                <DocumentViewer key={doc.id} document={doc} onRemove={() => handleRemove(doc.id)} />
              ))}
            </div>
          )}
        </section>
      </main>

      <style>{`
        @keyframes scan {
          0% { top: 0%; opacity: 0; }
          10% { opacity: 1; }
          90% { opacity: 1; }
          100% { top: 100%; opacity: 0; }
        }
      `}</style>
    </div>
  );
}
