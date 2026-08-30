'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { EmptyState, PageHeader } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { conversationsCollection } from '@/lib/amud/localConversations';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { conversationsSeed } from '@/data/amud/conversations';
import { entreprisesSeed } from '@/data/amud/entreprises';

export default function MessagesPage() {
  const { candidate, loading } = useCurrentCandidate();
  const [conversations] = useCollection(conversationsCollection, conversationsSeed);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);

  const mine = useMemo(
    () => conversations.filter((c) => c.candidateId === candidate?.id).sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations, candidate],
  );

  if (loading) return null;

  return (
    <div className="mx-auto max-w-2xl">
      <PageHeader title="Messages" />
      {mine.length === 0 ? (
        <EmptyState icon="mail" title="Aucun message pour le moment." description="Vos échanges avec les entreprises apparaîtront ici." />
      ) : (
        <div className="flex flex-col gap-sm">
          {mine.map((c) => {
            const last = c.messages[c.messages.length - 1];
            const unread = c.messages.filter((m) => m.sender === 'employer' && !m.read).length;
            const entrepriseNom = entreprises.find((e) => e.id === c.entrepriseId)?.nom ?? 'Entreprise';
            return (
              <Link key={c.id} href={`/amud/candidat/messages/${c.id}`} className="flex items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-colors hover:border-amud-primary">
                <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">
                  {entrepriseNom.charAt(0)}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-sm">
                    <p className="truncate text-body-md font-semibold text-amud-on-surface">{entrepriseNom}{c.offerTitre ? ` · ${c.offerTitre}` : ''}</p>
                    {last ? <span className="shrink-0 text-label-sm text-amud-on-surface-variant">{new Date(last.createdAt).toLocaleDateString('fr-FR')}</span> : null}
                  </div>
                  {last ? <p className="truncate text-label-sm text-amud-on-surface-variant">{last.text}</p> : null}
                </div>
                {unread > 0 ? <span className="flex h-6 min-w-[24px] shrink-0 items-center justify-center rounded-full bg-amud-secondary px-1.5 text-[11px] font-bold text-white">{unread}</span> : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
