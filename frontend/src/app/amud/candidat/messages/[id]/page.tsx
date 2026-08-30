'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { FormEvent, useEffect, useRef, useState } from 'react';
import { ErrorState } from '@/components/amud/ui';
import { useCurrentCandidate } from '@/lib/amud/useCurrentCandidate';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { conversationsCollection } from '@/lib/amud/localConversations';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { sendMessage, markConversationRead } from '@/lib/amud/messageCascades';
import { conversationsSeed } from '@/data/amud/conversations';
import { entreprisesSeed } from '@/data/amud/entreprises';

export default function ConversationPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const { candidate } = useCurrentCandidate();
  const [conversations] = useCollection(conversationsCollection, conversationsSeed);
  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const [text, setText] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);

  const conversation = conversations.find((c) => c.id === params.id && c.candidateId === candidate?.id);

  useEffect(() => {
    if (conversation) markConversationRead(conversation.id, 'employer');
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ block: 'end' });
  }, [conversation?.messages.length]);

  if (!conversation) {
    return (
      <div className="mx-auto max-w-2xl py-xl">
        <ErrorState title="Conversation introuvable" onRetry={() => router.push('/amud/candidat/messages')} />
      </div>
    );
  }

  const entrepriseNom = entreprises.find((e) => e.id === conversation.entrepriseId)?.nom ?? 'Entreprise';

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    sendMessage(conversation!, text, 'candidate');
    setText('');
  }

  return (
    <div className="mx-auto flex h-[calc(100vh-8rem)] max-w-2xl flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-md flex items-center gap-sm border-b border-amud-outline-variant pb-md">
        <Link href="/amud/candidat/messages" className="flex h-9 w-9 items-center justify-center rounded-full text-amud-primary hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <div>
          <p className="text-body-md font-semibold text-amud-on-surface">{entrepriseNom}</p>
          {conversation.offerTitre ? <p className="text-label-sm text-amud-on-surface-variant">{conversation.offerTitre}</p> : null}
        </div>
      </div>

      <div className="flex-1 space-y-sm overflow-y-auto py-md">
        {conversation.messages.map((m) => (
          <div key={m.id} className={`flex ${m.sender === 'candidate' ? 'justify-end' : 'justify-start'}`}>
            <div
              className={`max-w-[75%] rounded-2xl px-4 py-2 text-body-md shadow-sm ${
                m.sender === 'candidate' ? 'rounded-br-sm bg-amud-primary text-white' : 'rounded-bl-sm bg-amud-surface-container-high text-amud-on-surface'
              }`}
            >
              <p>{m.text}</p>
              <p className={`mt-1 text-[10px] ${m.sender === 'candidate' ? 'text-white/70' : 'text-amud-on-surface-variant'}`}>
                {new Date(m.createdAt).toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <form onSubmit={onSubmit} className="flex items-center gap-sm border-t border-amud-outline-variant pt-md" style={{ paddingBottom: 'max(8px, env(safe-area-inset-bottom))' }}>
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrivez votre message…"
          className="min-h-[44px] flex-1 rounded-full border border-amud-outline-variant bg-amud-surface px-4 py-2 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
        />
        <button
          type="submit"
          disabled={!text.trim()}
          aria-label="Envoyer"
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-amud-primary text-white shadow-sm transition-opacity disabled:cursor-not-allowed disabled:opacity-50"
        >
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}
