'use client';

import { useRef, useState } from 'react';
import { Button, EmptyState, PageHeader, ConfirmDialog } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { candidateDocumentsCollection } from '@/lib/amud/localCandidateDocuments';
import { addCandidateDocument, removeCandidateDocument, replaceCandidateDocument } from '@/lib/amud/candidateDocumentCascades';
import { DOCUMENT_TYPES, DOCUMENT_TYPE_ICON, type DocumentType, type CandidateDocument } from '@/data/amud/candidateDocuments';

const MAX_SIZE_BYTES = 3 * 1024 * 1024;

function readFileAsDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function DocumentsPage() {
  const { candidate, loading } = useCurrentCandidate();
  const notify = useToast();
  const [documents] = useCollection(candidateDocumentsCollection, []);
  const [pendingType, setPendingType] = useState<DocumentType | null>(null);
  const [replacingId, setReplacingId] = useState<string | null>(null);
  const [toDelete, setToDelete] = useState<CandidateDocument | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  if (loading || !candidate) return null;

  const myDocs = documents.filter((d) => d.candidateAccountId === candidate.id);

  function openPicker(type: DocumentType, replaceId?: string) {
    setPendingType(type);
    setReplacingId(replaceId ?? null);
    inputRef.current?.click();
  }

  async function onFileSelected(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !pendingType) return;
    if (file.size > MAX_SIZE_BYTES) {
      notify('Fichier trop volumineux (3 Mo max).', 'error');
      return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    if (replacingId) {
      replaceCandidateDocument(replacingId, { nom: file.name, dataUrl, mimeType: file.type, tailleKo: Math.round(file.size / 1024) });
      notify('Document remplacé', 'success');
    } else {
      addCandidateDocument({ candidateAccountId: candidate!.id, type: pendingType, nom: file.name, dataUrl, mimeType: file.type, tailleKo: Math.round(file.size / 1024) });
      notify('Document ajouté', 'success');
    }
    setPendingType(null);
    setReplacingId(null);
  }

  return (
    <div className="mx-auto max-w-3xl">
      <PageHeader title="Documents" subtitle="Gérez votre CV, vos diplômes, certificats et portfolio." />
      <input ref={inputRef} type="file" className="hidden" onChange={onFileSelected} accept=".pdf,.doc,.docx,.jpg,.jpeg,.png" />

      {myDocs.length === 0 ? (
        <EmptyState icon="description" title="Ajoutez votre CV pour pouvoir postuler." actionLabel="Ajouter mon CV" onAction={() => openPicker('CV')} />
      ) : null}

      <div className="flex flex-col gap-md">
        {DOCUMENT_TYPES.map((type) => {
          const docsOfType = myDocs.filter((d) => d.type === type);
          return (
            <div key={type} className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm">
              <div className="mb-sm flex items-center justify-between">
                <div className="flex items-center gap-sm">
                  <span className="material-symbols-outlined text-amud-primary">{DOCUMENT_TYPE_ICON[type]}</span>
                  <span className="text-label-md font-semibold text-amud-on-surface">{type}</span>
                </div>
                <Button size="sm" variant="secondary" icon="upload" onClick={() => openPicker(type)}>
                  Ajouter
                </Button>
              </div>
              {docsOfType.length === 0 ? (
                <p className="pl-8 text-label-sm text-amud-on-surface-variant">Aucun document.</p>
              ) : (
                <div className="flex flex-col gap-sm pl-8">
                  {docsOfType.map((doc) => (
                    <div key={doc.id} className="flex items-center justify-between gap-sm rounded-lg border border-amud-outline-variant bg-amud-surface px-md py-2">
                      <span className="min-w-0 truncate text-body-md text-amud-on-surface">{doc.nom}</span>
                      <div className="flex shrink-0 gap-1">
                        {doc.dataUrl ? (
                          <a href={doc.dataUrl} download={doc.nom} className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high" aria-label="Voir / télécharger">
                            <span className="material-symbols-outlined text-[18px]">visibility</span>
                          </a>
                        ) : null}
                        <button type="button" onClick={() => openPicker(type, doc.id)} aria-label="Remplacer" className="flex h-9 w-9 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high">
                          <span className="material-symbols-outlined text-[18px]">sync</span>
                        </button>
                        <button type="button" onClick={() => setToDelete(doc)} aria-label="Supprimer" className="flex h-9 w-9 items-center justify-center rounded-full text-amud-error hover:bg-amud-error-container">
                          <span className="material-symbols-outlined text-[18px]">delete</span>
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <ConfirmDialog
        open={Boolean(toDelete)}
        onClose={() => setToDelete(null)}
        onConfirm={() => {
          if (toDelete) removeCandidateDocument(toDelete.id);
          notify('Document supprimé', 'success');
        }}
        title="Supprimer ce document ?"
        description={toDelete ? `« ${toDelete.nom} » sera définitivement supprimé.` : undefined}
      />
    </div>
  );
}
