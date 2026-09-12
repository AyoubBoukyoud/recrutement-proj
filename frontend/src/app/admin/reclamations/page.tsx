'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { Badge, Button, Card, Notice, Tabs, TextareaField } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { parseSubject } from '@/lib/complaints';
import type { Complaint, ComplaintStatus } from '@/lib/complaints';
import type { PaginatedResponse } from '@/types/candidate';

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'open', label: 'Ouvertes' },
  { key: 'in_review', label: 'En cours' },
  { key: 'resolved', label: 'Résolues' },
];

const STATUS_BADGE: Record<ComplaintStatus, { tone: 'pending' | 'neutral' | 'done'; label: string }> = {
  open: { tone: 'pending', label: 'Ouverte' },
  in_review: { tone: 'neutral', label: 'En cours' },
  resolved: { tone: 'done', label: 'Résolue' },
};

/** La vue admin porte le téléphone en plus, pour l'auteur et pour qui a répondu. */
type AdminComplaint = Complaint & {
  user: { id: number; name: string | null; phone: string };
  responded_by: { id: number; name: string | null; phone: string } | null;
};

export default function AdminComplaints() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openId, setOpenId] = useState<number | null>(null);
  const [draftStatus, setDraftStatus] = useState<ComplaintStatus>('in_review');
  const [draftResponse, setDraftResponse] = useState('');

  const q = useQuery({
    queryKey: ['admin-complaints', status, page],
    queryFn: () =>
      api
        .get('/admin/complaints', { params: { status: status || undefined, page } })
        .then((r) => r.data as PaginatedResponse<AdminComplaint>),
  });

  const respond = useMutation({
    mutationFn: ({ id, status, response }: { id: number; status: ComplaintStatus; response: string }) =>
      api.patch(`/admin/complaints/${id}`, { status, response: response.trim() || undefined }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-complaints'] });
      setOpenId(null);
    },
  });

  const startResponding = (complaint: AdminComplaint) => {
    setOpenId(complaint.id);
    setDraftStatus(complaint.status === 'open' ? 'in_review' : complaint.status);
    setDraftResponse(complaint.admin_response ?? '');
  };

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">Réclamations</h1>
        <p className="helper-text mt-1">
          Ce que les candidats signalent depuis « Aide » dans l’app. Une réponse envoyée passe automatiquement
          la réclamation en « En cours » ou « Résolue » et prévient le candidat.
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

      {q.isError && <Notice>Impossible de charger les réclamations. Rechargez la page.</Notice>}
      {q.isSuccess && q.data.data.length === 0 && <p className="helper-text">Aucune réclamation ici.</p>}

      <div className="grid gap-3">
        {q.data?.data.map((complaint) => {
          const { subject, message } = parseSubject(complaint.body);
          const badge = STATUS_BADGE[complaint.status];
          const isOpen = openId === complaint.id;

          return (
            <Card key={complaint.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{complaint.user.name || complaint.user.phone}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                    <Badge tone="neutral">{complaint.type === 'voice' ? 'Vocal' : 'Texte'}</Badge>
                    {complaint.has_unread_response && <Badge tone="pending">Réponse non lue</Badge>}
                  </div>
                  <span className="helper-text">
                    {complaint.user.phone} · {new Date(complaint.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <Button variant={isOpen ? 'ghost' : 'primary'} size="compact" onClick={() => (isOpen ? setOpenId(null) : startResponding(complaint))}>
                  {isOpen ? 'Fermer' : complaint.admin_response ? 'Modifier la réponse' : 'Répondre'}
                </Button>
              </div>

              <div className="mt-3 grid gap-2">
                {subject && <p className="text-[13px] font-semibold text-on-surface-variant">{subject}</p>}
                {message && <p className="whitespace-pre-wrap text-[15px]">{message}</p>}
                {complaint.type === 'voice' && complaint.audio_url && (
                  <audio controls src={complaint.audio_url} className="mt-1 h-10 w-full max-w-sm" />
                )}
                {complaint.type === 'voice' && !complaint.audio_url && (
                  <p className="helper-text">Message vocal — fichier introuvable.</p>
                )}
              </div>

              {complaint.admin_response && !isOpen && (
                <div className="mt-3 rounded-element border border-outline-variant bg-surface-container p-3">
                  <p className="text-[13px] font-semibold text-on-surface-variant">
                    Réponse {complaint.responded_by ? `de ${complaint.responded_by.name || complaint.responded_by.phone}` : ''}
                    {complaint.responded_at && ` · ${new Date(complaint.responded_at).toLocaleString('fr-FR')}`}
                  </p>
                  <p className="mt-1 whitespace-pre-wrap text-[15px]">{complaint.admin_response}</p>
                </div>
              )}

              {isOpen && (
                <div className="mt-4 grid gap-3 border-t border-outline-variant pt-4">
                  <div className="flex flex-wrap gap-2">
                    {(['in_review', 'resolved', 'open'] as ComplaintStatus[]).map((s) => (
                      <Button
                        key={s}
                        variant={draftStatus === s ? 'primary' : 'ghost'}
                        size="compact"
                        onClick={() => setDraftStatus(s)}
                      >
                        {STATUS_BADGE[s].label}
                      </Button>
                    ))}
                  </div>
                  <TextareaField
                    label="Réponse au candidat"
                    hint="Visible par le candidat dans l’app"
                    value={draftResponse}
                    onChange={(e) => setDraftResponse(e.target.value)}
                    rows={4}
                  />
                  {respond.isError && <Notice>L’enregistrement a échoué. Réessayez.</Notice>}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => respond.mutate({ id: complaint.id, status: draftStatus, response: draftResponse })}
                      disabled={respond.isPending}
                    >
                      {respond.isPending ? 'Enregistrement…' : 'Enregistrer'}
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

      <Pagination
        page={page}
        data={q.data}
        onPage={setPage}
        noun="réclamation"
        language="fr"
      />
    </main>
  );
}
