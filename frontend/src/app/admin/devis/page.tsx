'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { apiErrorMessage } from '@/lib/apiError';
import { Badge, Button, Card, Notice, Tabs } from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import type { QuoteService } from '@/lib/quoteRequests';
import type { PaginatedResponse } from '@/types/candidate';

type QuoteStatus = 'new' | 'contacted' | 'closed';

interface QuoteRequest {
  id: number;
  name: string;
  email: string;
  service: QuoteService;
  message: string;
  status: QuoteStatus;
  created_at: string;
}

const STATUS_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'new', label: 'Nouvelles' },
  { key: 'contacted', label: 'Contactées' },
  { key: 'closed', label: 'Clôturées' },
];

const SERVICE_LABEL: Record<QuoteService, string> = {
  'mobile-apps': 'Sites web & applications mobiles',
  engineering: 'Ingénierie & infrastructures',
  games: 'Jeux éducatifs & gamification',
  training: 'Formation continue',
};

const SERVICE_TABS: { key: string; label: string }[] = [
  { key: '', label: 'Tous les services' },
  ...Object.entries(SERVICE_LABEL).map(([key, label]) => ({ key, label })),
];

const STATUS_BADGE: Record<QuoteStatus, { tone: 'pending' | 'neutral' | 'done'; label: string }> = {
  new: { tone: 'pending', label: 'Nouvelle' },
  contacted: { tone: 'neutral', label: 'Contactée' },
  closed: { tone: 'done', label: 'Clôturée' },
};

/**
 * File de suivi des demandes de devis envoyées depuis la page publique
 * `/notre-entreprise` (soumission anonyme via `POST /quote-requests`). Même
 * idiome que `/admin/contact`, avec en plus le service demandé : on marque
 * la demande contactée, puis clôturée.
 */
export default function AdminQuoteRequests() {
  const qc = useQueryClient();
  const [status, setStatus] = useState('');
  const [service, setService] = useState('');
  const [page, setPage] = useState(1);

  const q = useQuery({
    queryKey: ['admin-quote-requests', status, service, page],
    queryFn: () =>
      api
        .get('/admin/quote-requests', {
          params: { status: status || undefined, service: service || undefined, page },
        })
        .then((r) => r.data as PaginatedResponse<QuoteRequest>),
  });

  const updateStatus = useMutation({
    mutationFn: ({ id, status }: { id: number; status: QuoteStatus }) =>
      api.patch(`/admin/quote-requests/${id}`, { status }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['admin-quote-requests'] }),
  });

  return (
    <div className="mx-auto grid grid-cols-1 max-w-5xl gap-4 sm:p-6">
      <header>
        <h1 className="text-2xl font-bold">Demandes de devis</h1>
        <p className="helper-text mt-1">
          Demandes envoyées depuis la page « Notre entreprise » du site public — entreprises sans compte.
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
      <Tabs
        tabs={SERVICE_TABS}
        active={service}
        onChange={(key) => {
          setService(key);
          setPage(1);
        }}
      />

      {q.isError && <Notice>{apiErrorMessage(q.error, 'Impossible de charger les demandes. Rechargez la page.')}</Notice>}
      {q.isSuccess && q.data.data.length === 0 && <p className="helper-text">Aucune demande ici.</p>}

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
                    <Badge tone="neutral">{SERVICE_LABEL[item.service] ?? item.service}</Badge>
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
                  {item.status !== 'contacted' && (
                    <Button
                      variant="ghost"
                      size="compact"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'contacted' })}
                    >
                      Marquer contactée
                    </Button>
                  )}
                  {item.status !== 'closed' && (
                    <Button
                      variant="ghost"
                      size="compact"
                      disabled={updateStatus.isPending}
                      onClick={() => updateStatus.mutate({ id: item.id, status: 'closed' })}
                    >
                      Clôturer
                    </Button>
                  )}
                </div>
              </div>

              <p className="mt-3 whitespace-pre-wrap text-[15px]">{item.message}</p>
            </Card>
          );
        })}
      </div>

      {updateStatus.isError && <Notice>{apiErrorMessage(updateStatus.error, 'La mise à jour a échoué.')}</Notice>}

      <Pagination page={page} data={q.data} onPage={setPage} noun="demande" language="fr" />
    </div>
  );
}
