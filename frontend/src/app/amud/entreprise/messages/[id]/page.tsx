'use client';

import Link from 'next/link';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { conversationsCollection } from '@/lib/amud/localConversations';
import { conversationsSeed } from '@/data/amud/conversations';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { sendMessage } from '@/lib/amud/messageCascades';

function initialsOf(nom: string): string {
  return nom.split(/\s+/).map((w) => w[0]).join('').slice(0, 2).toUpperCase();
}

export default function AmudEntrepriseMessageThreadPage() {
  const params = useParams<{ id: string }>();
  const [conversations] = useCollection(conversationsCollection, conversationsSeed);
  const [text, setText] = useState('');
  const markedRead = useRef(false);

  const conversation = conversations.find((c) => c.id === params.id && c.entrepriseId === CURRENT_EMPLOYER.entrepriseId);

  useEffect(() => {
    if (markedRead.current || !conversation) return;
    const hasUnread = conversation.messages.some((m) => m.sender === 'candidate' && !m.read);
    if (!hasUnread) return;
    markedRead.current = true;
    const messages = conversation.messages.map((m) => (m.sender === 'candidate' ? { ...m, read: true } : m));
    conversationsCollection.update(conversation.id, { messages });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversation?.id]);

  if (!conversation) {
    return (
      <div className="rounded-xl border border-dashed border-amud-outline-variant p-xl text-center">
        <p className="text-body-md font-medium text-amud-on-surface">Conversation introuvable.</p>
        <Link href="/amud/entreprise/messages" className="mt-md inline-flex items-center gap-1 text-label-md font-medium text-amud-primary hover:underline">
          Retour aux messages
        </Link>
      </div>
    );
  }

  function handleSend(e: React.FormEvent) {
    e.preventDefault();
    if (!text.trim() || !conversation) return;
    sendMessage(conversation, text);
    setText('');
  }

  return (
    <div className="flex h-[calc(100vh-11rem)] flex-col md:h-[calc(100vh-4rem)]">
      <div className="mb-md flex items-center gap-md">
        <Link href="/amud/entreprise/messages" className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-low">
          <span className="material-symbols-outlined">arrow_back</span>
        </Link>
        <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amud-primary-fixed text-[13px] font-bold text-amud-on-primary-fixed">{initialsOf(conversation.candidateNom)}</span>
        <div className="min-w-0">
          <p className="truncate font-bold text-amud-on-surface">{conversation.candidateNom}</p>
          {conversation.offerTitre ? <p className="truncate text-label-sm text-amud-on-surface-variant">{conversation.offerTitre}</p> : null}
        </div>
        <Link href={`/amud/entreprise/candidats/${conversation.candidateId}`} className="ml-auto shrink-0 text-label-sm font-medium text-amud-primary hover:underline">
          Voir profil
        </Link>
      </div>

      <div className="flex-1 space-y-sm overflow-y-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md">
        {conversation.messages.length === 0 ? (
          <p className="p-lg text-center text-label-md text-amud-on-surface-variant">Aucun message. Envoyez le premier message ci-dessous.</p>
        ) : (
          conversation.messages.map((m) => (
            <div key={m.id} className={`flex ${m.sender === 'employer' ? 'justify-end' : 'justify-start'}`}>
              <div className={`max-w-[80%] rounded-xl px-md py-2 text-body-md ${m.sender === 'employer' ? 'bg-amud-primary text-white' : 'bg-amud-surface text-amud-on-surface'}`}>
                <p>{m.text}</p>
                <p className={`mt-1 text-[10px] ${m.sender === 'employer' ? 'text-white/70' : 'text-amud-on-surface-variant'}`}>{new Date(m.createdAt).toLocaleString('fr-FR')}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <form onSubmit={handleSend} className="mt-md flex items-center gap-sm">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Écrire un message…"
          aria-label="Écrire un message"
          className="flex-1 rounded-full border border-amud-outline-variant bg-amud-surface px-lg py-3 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
          type="text"
        />
        <button type="submit" disabled={!text.trim()} className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-amud-primary text-white shadow-sm hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-40">
          <span className="material-symbols-outlined">send</span>
        </button>
      </form>
    </div>
  );
}
