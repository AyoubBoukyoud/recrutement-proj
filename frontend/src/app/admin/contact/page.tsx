'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, Tabs } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import type { PaginatedResponse } from '@/types/candidate';

type ContactStatus = 'new' | 'read' | 'archived';

interface ContactMessage {
  id: number;
  name: string;
  email: string;
  message: string;
  status: ContactStatus;
  created_at: string;
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous' },
  { key: 'new', label: 'Nouveaux' },
  { key: 'read', label: 'Lus' },
  { key: 'archived', label: 'Archivés' },
];

const STATUS_BADGE: Record<ContactStatus, { tone: 'pending' | 'neutral' | 'done'; label: string }> = {
  new: { tone: 'pending', label: 'Nouveau' },
  read: { tone: 'neutral', label: 'Lu' },
  archived: { tone: 'done', label: 'Archivé' },
};

/**
 * File de tri des messages envoyés depuis le formulaire « Contact » du bas
 * de la page d'accueil publique (`ContactSection`, soumission anonyme via
 * `POST /contact`). Même idiome que `/admin/reclamations`, en plus simple :
 * pas de réponse à envoyer, juste marquer lu/archivé.
 */
export default function AdminContact() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['admin-contact-messages', status, page],
    queryFn: () =>
      api
        .get('/admin/contact-messages', { params: { status: status || undefined, page } })
        .then((r) => r.data as PaginatedResponse<ContactMessage>),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: ContactStatus }) =>
      api.patch(`/admin/contact-messages/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-contact-messages'] }),
  });

  return (
    <main className="mx-auto grid max-w-5xl gap-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">Contact</h1>
        <p className="helper-text mt-1">
          Messages envoyés depuis le formulaire « Contact » du site public — visiteurs sans compte.
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

      {q.isError && <Notice>{apiErrorMessage(q.error, 'Impossible de charger les messages. Rechargez la page.')}</Notice>}
      {q.isSuccess && q.data.data.length === 0 && <p className="helper-text">Aucun message ici.</p>}

      <div className="grid gap-3">
        {q.data?.data.map((item) => {
          const badge = STATUS_BADGE[item.status];

          return (
            <Card key={item.id}>
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{item.name}</span>
                    <Badge tone={badge.tone}>{badge.label}</Badge>
                  </div>
                  <span className="helper-text">
                    <a href={`mailto:${item.email}`} className="hover:underline">
                      {item.email}
                    </a>
                    {' · '}
                    {new Date(item.created_at).toLocaleString('fr-FR')}
                  </span>
                </div>
                <div className="flex gap-2">
                  {item.status !== 'read' && (
                    <Button
                      variant="ghost"
                      size="compact"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'read' })}
                    >
                      Marquer lu
                    </Button>
                  )}
                  {item.status !== 'archived' && (
                    <Button
                      variant="ghost"
                      size="compact"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'archived' })}
                    >
                      Archiver
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-[15px]">{item.message}</p>
            </Card>
          );
        })}
      </div>

      {updateStatus.isError && <Notice>{apiErrorMessage(updateStatus.error, "La mise à jour a échoué.")}</Notice>}

      <Pagination page={page} data={q.data} onPage={setPage} noun="message" language="fr" />
    </main>
  );
}
