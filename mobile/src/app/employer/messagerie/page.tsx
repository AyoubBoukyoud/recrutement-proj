'use client';

// Interface 22 — Messagerie employeur.

import { Suspense, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import { Send, ChevronLeft } from 'lucide-react';
import { useNetwork } from '@/context/NetworkContext';
import { useLanguage } from '@/context/LanguageContext';
import { MOCK_CONVERSATIONS } from '@/lib/mockData';
import type { Conversation, Message } from '@/lib/types';

function MessagerieContent() {
  const searchParams = useSearchParams();
  const candidatId = searchParams.get('candidat');
  const { isOnline, queueAction } = useNetwork();
  const { t } = useLanguage();

  const [conversations, setConversations] = useState<Conversation[]>(MOCK_CONVERSATIONS);
  const initialSelected = useMemo(
    () => conversations.find((c) => c.candidateId === candidatId)?.id ?? conversations[0]?.id ?? null,
    // eslint-disable-next-line react-hooks/exhaustive-deps
    []
  );
  const [selectedId, setSelectedId] = useState<string | null>(initialSelected);
  const [draft, setDraft] = useState('');
  const [showThreadOnMobile, setShowThreadOnMobile] = useState(Boolean(candidatId));

  const selected = conversations.find((c) => c.id === selectedId) ?? null;

  const handleSend = () => {
    if (!draft.trim() || !selected) return;
    const message: Message = {
      id: `m_${Date.now()}`,
      authorId: 'emp_1',
      authorRole: 'employer',
      text: draft,
      sentAt: new Date().toISOString(),
    };
    setConversations((prev) =>
      prev.map((c) =>
        c.id === selected.id
          ? { ...c, messages: [...c.messages, message], lastMessage: draft, lastMessageAt: message.sentAt }
          : c
      )
    );
    if (!isOnline) {
      queueAction('employer_message', { conversationId: selected.id, text: draft });
    }
    setDraft('');
  };

  return (
    <div className="mx-auto flex h-[calc(100vh-3rem)] max-w-5xl overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-soft md:h-[calc(100vh-6rem)]">
      <aside className={`w-full shrink-0 overflow-y-auto border-r border-gray-100 md:block md:w-80 ${showThreadOnMobile ? 'hidden' : 'block'}`}>
        <div className="border-b border-gray-100 p-4">
          <h1 className="text-base font-bold text-navy-900">{t('employer:messagerie.title')}</h1>
        </div>
        {conversations.map((conv) => (
          <button
            key={conv.id}
            type="button"
            onClick={() => {
              setSelectedId(conv.id);
              setShowThreadOnMobile(true);
            }}
            className={`flex w-full items-start gap-3 border-b border-gray-50 p-4 text-left transition hover:bg-surface-container ${
              selectedId === conv.id ? 'bg-blue-50' : ''
            }`}
          >
            <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-navy-900 text-xs font-bold text-white">
              {conv.candidateName.split(' ').map((n) => n[0]).join('')}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex items-center justify-between">
                <span className="truncate text-sm font-bold text-navy-900">{conv.candidateName}</span>
                {conv.unread > 0 && (
                  <span className="flex h-4 w-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white">
                    {conv.unread}
                  </span>
                )}
              </div>
              <p className="truncate text-xs text-onSurface-variant">{conv.lastMessage}</p>
            </div>
          </button>
        ))}
      </aside>

      <section className={`flex flex-1 flex-col ${showThreadOnMobile ? 'flex' : 'hidden md:flex'}`}>
        {selected ? (
          <>
            <div className="flex items-center gap-2 border-b border-gray-100 p-4">
              <button type="button" onClick={() => setShowThreadOnMobile(false)} className="text-navy-900 md:hidden">
                <ChevronLeft size={20} />
              </button>
              <span className="text-sm font-bold text-navy-900">{selected.candidateName}</span>
            </div>
            <div className="flex-1 space-y-3 overflow-y-auto p-4">
              {selected.messages.map((msg) => (
                <div key={msg.id} className={`flex ${msg.authorRole === 'employer' ? 'justify-end' : 'justify-start'}`}>
                  <div
                    className={`max-w-[75%] rounded-2xl px-3.5 py-2 text-sm ${
                      msg.authorRole === 'employer' ? 'bg-navy-900 text-white' : 'bg-surface-container text-onSurface'
                    }`}
                  >
                    {msg.text}
                  </div>
                </div>
              ))}
            </div>
            <div className="flex items-center gap-2 border-t border-gray-100 p-3">
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSend()}
                placeholder={t('employer:messagerie.placeholder')}
                className="flex-1 rounded-full border border-gray-200 px-4 py-2.5 text-sm outline-none focus:border-navy-900"
              />
              <button
                type="button"
                onClick={handleSend}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-amber-500 text-white"
                aria-label={t('employer:messagerie.send')}
              >
                <Send size={16} />
              </button>
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-sm text-onSurface-variant">
            {t('employer:messagerie.selectConversation')}
          </div>
        )}
      </section>
    </div>
  );
}

export default function MessageriePage() {
  return (
    <Suspense fallback={null}>
      <MessagerieContent />
    </Suspense>
  );
}
