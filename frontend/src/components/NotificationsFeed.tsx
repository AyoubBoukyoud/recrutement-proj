'use client';

import Link from 'next/link';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '@/lib/opsApi';
import { Button, Card } from '@/components/ui';
import type { Page, CandidateNotification } from '@/lib/candidateMarketplace';

export function NotificationsFeed() {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ['ops-notifications'] });
  const query = useQuery({
    queryKey: ['ops-notifications'],
    queryFn: () => api.get('/candidate/notifications').then((response) => response.data as Page<CandidateNotification>),
    refetchInterval: 60000,
  });
  const read = useMutation({ mutationFn: (id: number) => api.patch(`/candidate/notifications/${id}/read`), onSuccess: refresh });
  const all = useMutation({ mutationFn: () => api.patch('/candidate/notifications/read-all'), onSuccess: refresh });

  return (
    <main className="mx-auto grid max-w-4xl gap-4 p-6">
      <div className="flex justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Notifications</h1>
          <p className="helper-text mt-1">Les événements importants de votre espace apparaissent ici.</p>
        </div>
        <Button variant="ghost" size="compact" onClick={() => all.mutate()} disabled={all.isPending}>Tout marquer comme lu</Button>
      </div>
      {query.isError && <p role="alert" className="text-error">Impossible de charger les notifications.</p>}
      {query.data?.data.length === 0 && <p className="helper-text">Aucune notification.</p>}
      {query.data?.data.map((notification) => (
        <Card key={notification.id}>
          <div className="flex items-start justify-between gap-4">
            <button type="button" className="min-w-0 flex-1 text-left" onClick={() => !notification.read_at && read.mutate(notification.id)}>
              <div className="flex items-center gap-2"><h2 className="font-bold">{notification.title}</h2>{!notification.read_at && <span className="h-2 w-2 rounded-full bg-primary" aria-label="Non lue" />}</div>
              <p className="helper-text mt-1">{notification.body}</p>
              <time className="mt-2 block text-xs text-outline">{new Date(notification.created_at).toLocaleString('fr-FR')}</time>
            </button>
            {notification.link && <Link href={notification.link} onClick={() => !notification.read_at && read.mutate(notification.id)} className="shrink-0 text-sm font-bold text-primary hover:underline">Ouvrir</Link>}
          </div>
        </Card>
      ))}
    </main>
  );
}
