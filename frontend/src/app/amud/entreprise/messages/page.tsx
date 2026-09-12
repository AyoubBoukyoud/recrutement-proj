'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { conversationsCollection } from '@/lib/amud/localConversations';
import { conversationsSeed } from '@/data/amud/conversations';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseMessagesPage() {
  const [conversations] = useCollection(conversationsCollection, conversationsSeed);

  const myConversations = useMemo(
    () =>
      conversations
        .filter((c) => c.entrepriseId === CURRENT_EMPLOYER.entrepriseId)
        .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
    [conversations],
  );

  return (
    <div>
      <div className="mb-lg">
        <h2 className="text-headline-lg text-amud-on-surface">Messages</h2>
        <p className="mt-1 text-body-md text-amud-on-surface-variant">Vos conversations avec les candidats.</p>
      </div>

      {myConversations.length === 0 ? (
        <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-on-surface-variant">chat_bubble_outline</span>
          <p className="mt-sm text-body-md font-medium text-amud-on-surface">Aucun message.</p>
          <p className="mt-1 text-label-sm text-amud-on-surface-variant">Contactez un candidat depuis sa fiche ou sa candidature pour démarrer une conversation.</p>
        </div>
      ) : (
        <div className="divide-y divide-amud-outline-variant overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest">
          {myConversations.map((c) => {
            const lastMessage = c.messages.at(-1);
            const unread = c.messages.filter((m) => m.sender === 'candidate' && !m.read).length;
            return (
              <Link key={c.id} href={`/amud/entreprise/messages/${c.id}`} className="flex items-center gap-md p-md transition-colors hover:bg-amud-surface-container-low">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(c.candidateNom)}</span>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center justify-between gap-sm">
                    <span className={`truncate font-bold text-amud-on-surface ${unread > 0 ? '' : ''}`}>{c.candidateNom}</span>
                    <span className="shrink-0 text-label-sm text-amud-on-surface-variant">{lastMessage ? new Date(lastMessage.createdAt).toLocaleDateString('fr-FR') : ''}</span>
                  </div>
                  <p className="truncate text-label-sm text-amud-on-surface-variant">{lastMessage?.text ?? ''}</p>
                </div>
                {unread > 0 ? (
                  <span className="flex h-5 min-w-[20px] shrink-0 items-center justify-center rounded-full bg-amud-secondary px-1.5 text-[11px] font-bold text-white">{unread}</span>
                ) : null}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
