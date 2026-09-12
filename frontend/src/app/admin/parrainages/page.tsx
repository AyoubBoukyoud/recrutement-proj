'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, Tabs, TextareaField, Eyebrow } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import type { PaginatedResponse } from '@/types/candidate';

type CommissionStatus = 'pending' | 'qualified' | 'approved' | 'paid' | 'rejected';

type AdminReferral = {
  id: number;
  agent: string | null;
  agent_id: number;
  candidate: string | null;
  candidate_submitted: boolean;
  registered_at: string;
  commission_status: CommissionStatus;
  commission_amount: string | number | null;
  commission_currency: string | null;
  payout_reference: string | null;
  payout_note: string | null;
};

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'pending', label: 'En attente' },
  { key: 'qualified', label: 'Acquises' },
  { key: 'approved', label: 'Approuvées' },
  { key: 'paid', label: 'Payées' },
  { key: 'rejected', label: 'Rejetées' },
];

const STATUS_BADGE: Record<CommissionStatus, { tone: 'pending' | 'neutral' | 'done' | 'error'; label: string }> = {
  pending: { tone: 'neutral', label: 'En attente du dossier' },
  qualified: { tone: 'pending', label: 'Acquise' },
  approved: { tone: 'pending', label: 'Approuvée' },
  paid: { tone: 'done', label: 'Payée' },
  rejected: { tone: 'error', label: 'Rejetée' },
};

/** Ce que l'admin peut décider — pas les deux statuts que le système pose seul. */
const RESOLVABLE: { status: 'approved' | 'paid' | 'rejected'; label: string }[] = [
  { status: 'approved', label: 'Approuver' },
  { status: 'paid', label: 'Marquer payée' },
  { status: 'rejected', label: 'Rejeter' },
];

export default function AdminReferrals() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<'approved' | 'paid' | 'rejected'>('approved');
  const [draftReference, setDraftReference] = useState('');
  const [draftNote, setDraftNote] = useState('');

  const q = useQuery({
    queryKey: ['admin-referrals', status, page],
    queryFn: () =>
      api
        .get('/admin/referrals', { params: { status: status || undefined, page } })
        .then((r) => r.data as PaginatedResponse<AdminReferral>),
  });

  const resolve = useMutation({
    mutationFn: ({
      id,
      commission_status,
      payout_reference,
      payout_note,
    }: {
      id: number;
      commission_status: string;
      payout_reference: string;
      payout_note: string;
    }) =>
      api.patch(`/admin/referrals/${id}`, {
        commission_status,
        payout_reference: payout_reference.trim() || undefined,
        payout_note: payout_note.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-referrals'] });
      setOpenId(null);
    },
  });

  const startResolving = (referral: AdminReferral) => {
    setOpenId(referral.id);
    setDraftStatus(referral.commission_status === 'rejected' ? 'rejected' : referral.commission_status === 'paid' ? 'paid' : 'approved');
    setDraftReference(referral.payout_reference ?? '');
    setDraftNote(referral.payout_note ?? '');
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">Parrainages</h1>
        <p className="helper-text mt-1">
          Qui chaque agent a amené, et où en est la commission. Une inscription qualifie dès que le candidat
          soumet son dossier ; approuver et marquer payé restent des décisions humaines.
        </p>
      </header>

      <Tabs
        tabs={STATUS_TABS}
        active={status}
        onChange={(key) => {
          setStatus(key);
          setPage(1);
        }}
      />

      {q.isError && <Notice>Impossible de charger les parrainages. Rechargez la page.</Notice>}
      {q.isSuccess && q.data.data.length === 0 && <p className="helper-text">Aucun parrainage ici.</p>}

      <div className="grid gap-3">
        {q.data?.data.map((referral) => {
          const badge = STATUS_BADGE[referral.commission_status];
          const isOpen = openId === referral.id;
          const amount =
            referral.commission_amount == null
              ? '—'
              : `${Number(referral.commission_amount).toFixed(2)} ${referral.commission_currency ?? ''}`.trim();

          return (
            <Card key={referral.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{referral.candidate ?? 'Inscrit, nom non renseigné'}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    {referral.candidate_submitted && <Badge tone="neutral">Dossier soumis</Badge>}
                  </div>
                  <span className="helper-text">
                    Amené par {referral.agent ?? `agent #${referral.agent_id}`} ·{' '}
                    {new Date(referral.registered_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="grid justify-items-end gap-1">
                  <span className="font-mono text-sm tabular-nums text-on-surface">{amount}</span>
                  {referral.commission_status !== 'pending' && (
                    <Button
                      variant={isOpen ? 'ghost' : 'primary'}
                      size="compact"
                      onClick={() => (isOpen ? setOpenId(null) : startResolving(referral))}
                    >
                      {isOpen ? 'Fermer' : 'Résoudre'}
                    </Button>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="mt-4 grid gap-3 border-t border-outline-variant pt-4">
                  <div className="flex flex-wrap gap-2">
                    {RESOLVABLE.map(({ status: s, label }) => (
                      <Button
                        key={s}
                        variant={draftStatus === s ? 'primary' : 'ghost'}
                        size="compact"
                        onClick={() => setDraftStatus(s)}
                      >
                        {label}
                      </Button>
                    ))}
                  </div>
                  <label className="grid gap-1.5">
                    <Eyebrow>Référence de versement</Eyebrow>
                    <input
                      value={draftReference}
                      onChange={(e) => setDraftReference(e.target.value)}
                      placeholder="Virement, reçu espèces…"
                      className="rounded-element border border-outline-variant bg-transparent px-3 py-2 text-sm text-on-surface outline-none focus:border-primary"
                    />
                  </label>
                  <TextareaField
                    label="Note interne"
                    hint="Non visible par l'agent"
                    value={draftNote}
                    onChange={(e) => setDraftNote(e.target.value)}
                    rows={3}
                  />
                  {resolve.isError && (
                    <Notice>{apiErrorMessage(resolve.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
                  )}
                  <div className="flex gap-2">
                    <Button
                      onClick={() =>
                        resolve.mutate({
                          id: referral.id,
                          commission_status: draftStatus,
                          payout_reference: draftReference,
                          payout_note: draftNote,
                        })
                      }
                      disabled={resolve.isPending}
                    >
                      {resolve.isPending ? 'Enregistrement…' : 'Enregistrer'}
                    </Button>
                    <Button variant="ghost" onClick={() => setOpenId(null)}>
                      Annuler
                    </Button>
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      <Pagination page={page} data={q.data} onPage={setPage} noun="parrainage" language="fr" />
    </main>
  );
}
