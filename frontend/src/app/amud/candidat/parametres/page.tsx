'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { Button, ConfirmDialog, PageHeader } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { logoutCandidate } from '@/lib/amud/candidateAuthCascades';
import { candidateAccountsCollection } from '@/lib/amud/localCandidateAccounts';
import { candidateAuthCollection } from '@/lib/amud/localCandidateAuth';
import { clearCandidateSession } from '@/lib/amud/candidateSession';

export default function ParametresPage() {
  const router = useRouter();
  const notify = useToast();
  const { candidate, loading } = useCurrentCandidate();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (loading || !candidate) return null;

  function logout() {
    logoutCandidate();
    notify('Vous avez été déconnecté(e).', 'info');
    router.push('/amud/candidat');
  }

  function deleteAccount() {
    const auth = candidateAuthCollection.getAll().find((a) => a.candidateAccountId === candidate!.id);
    if (auth) candidateAuthCollection.remove(auth.id);
    candidateAccountsCollection.remove(candidate!.id);
    clearCandidateSession();
    notify('Votre compte a été supprimé.', 'success');
    router.push('/amud/candidat');
  }

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Paramètres" />

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Mon compte</h2>
        <dl className="flex flex-col gap-sm text-body-md">
          <Row label="Nom complet" value={`${candidate.prenom} ${candidate.nom}`} />
          <Row label="Email" value={candidate.email} />
          <Row label="Téléphone" value={candidate.telephone} />
        </dl>
      </div>

      <div className="mb-lg rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm">
        <h2 className="mb-md text-title-lg text-amud-on-surface">Session</h2>
        <Button variant="secondary" icon="logout" onClick={logout}>
          Se déconnecter
        </Button>
      </div>

      <div className="rounded-xl border border-amud-error/30 bg-amud-error-container/20 p-lg">
        <h2 className="mb-1 text-title-lg text-amud-on-surface">Zone de danger</h2>
        <p className="mb-md text-body-md text-amud-on-surface-variant">La suppression de votre compte efface définitivement votre profil, vos candidatures et vos documents de cet appareil.</p>
        <Button variant="danger" icon="delete_forever" onClick={() => setDeleteOpen(true)}>
          Supprimer mon compte
        </Button>
      </div>

      <ConfirmDialog
        open={deleteOpen}
        onClose={() => setDeleteOpen(false)}
        onConfirm={deleteAccount}
        title="Supprimer votre compte ?"
        description="Cette action est irréversible."
        confirmLabel="Supprimer définitivement"
      />
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between border-b border-amud-outline-variant/60 py-1.5">
      <dt className="text-amud-on-surface-variant">{label}</dt>
      <dd className="font-medium text-amud-on-surface">{value}</dd>
    </div>
  );
}
