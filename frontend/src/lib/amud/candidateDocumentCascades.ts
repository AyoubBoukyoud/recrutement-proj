'use client';

import { generateId } from './storage/ids';
import { candidateDocumentsCollection } from './localCandidateDocuments';
import { candidateActivitiesCollection } from './localCandidateActivities';
import { pushNotification } from './storage/notify';
import type { CandidateDocument, DocumentType } from '@/data/amud/candidateDocuments';

export function addCandidateDocument(input: { candidateAccountId: string; type: DocumentType; nom: string; dataUrl?: string; mimeType?: string; tailleKo?: number }): CandidateDocument {
  const doc: CandidateDocument = {
    id: generateId('candidate_doc'),
    candidateAccountId: input.candidateAccountId,
    type: input.type,
    nom: input.nom,
    dataUrl: input.dataUrl,
    mimeType: input.mimeType,
    tailleKo: input.tailleKo,
    uploadedAt: new Date().toISOString(),
  };
  candidateDocumentsCollection.add(doc);

  candidateActivitiesCollection.add({
    id: generateId('candidate_activity'),
    candidateAccountId: input.candidateAccountId,
    type: 'cv',
    label: input.type === 'CV' ? 'CV ajouté' : `Document ajouté : ${input.nom}`,
    href: '/amud/candidat/documents',
    createdAt: doc.uploadedAt,
  });

  if (input.type === 'CV') {
    pushNotification({
      scope: 'candidate',
      targetId: input.candidateAccountId,
      title: 'Votre CV a bien été ajouté à votre profil.',
      category: 'Profil',
      href: '/amud/candidat/documents',
    });
  }

  return doc;
}

export function replaceCandidateDocument(id: string, patch: Partial<CandidateDocument>) {
  return candidateDocumentsCollection.update(id, { ...patch, uploadedAt: new Date().toISOString() });
}

export function removeCandidateDocument(id: string) {
  candidateDocumentsCollection.remove(id);
}
