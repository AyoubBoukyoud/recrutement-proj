'use client';

import { useEffect, useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { apiGet, apiPatch, apiPost } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { PaginatedResponse } from '@/types/candidate';

type WorkspaceRole = 'candidate' | 'recruiter';

type ConversationSummary = {
  id: number;
  application_id: number;
  offer_title: string | null;
  other_user: { id: number; name: string | null } | null;
  last_message: MessageRow | null;
  unread_count: number;
  last_message_at: string | null;
};

type MessageRow = {
  id: number;
  body: string;
  sender_id: number;
  sender_name: string | null;
  is_mine: boolean;
  read_at: string | null;
  created_at: string;
};

type ConversationThread = {
  conversation: ConversationSummary;
  messages: MessageRow[];
};

type ApplicationOption = {
  id: number;
  offer?: { title?: string | null } | null;
  candidate_profile?: { first_name?: string | null; last_name?: string | null } | null;
};

function formatDate(value: string | null) {
  if (!value) return 'Aucun message';
  return new Date(value).toLocaleString('fr-FR', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' });
}

function otherName(conversation: ConversationSummary) {
  return conversation.other_user?.name?.trim() || 'Contact';
}

export function MessagesWorkspace({ role }: { role: WorkspaceRole }) {
  const { token } = useAuth();
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [newApplicationId, setNewApplicationId] = useState('');
  const [draft, setDraft] = useState('');
  const [error, setError] = useState<string | null>(null);

  const conversations = useQuery({
    queryKey: ['messages', role],
    queryFn: () => apiGet<PaginatedResponse<ConversationSummary>>('/messages', token as string),
    enabled: Boolean(token),
  });

  const applications = useQuery({
    queryKey: ['message-applications', role],
    queryFn: () => apiGet<PaginatedResponse<ApplicationOption>>(role === 'candidate' ? '/candidate/applications' : '/recruiter/applications', token as string),
    enabled: Boolean(token),
  });

  const rows = useMemo(() => conversations.data?.data ?? [], [conversations.data]);
  const selected = rows.find((row) => row.id === selectedId) ?? null;

  useEffect(() => {
    const requested = new URLSearchParams(window.location.search).get('conversation');
    if (requested) setSelectedId(Number(requested));
  }, []);

  useEffect(() => {
    if (selectedId === null && rows[0]) setSelectedId(rows[0].id);
  }, [rows, selectedId]);

  const thread = useQuery({
    queryKey: ['message-thread', selectedId],
    queryFn: () => apiGet<ConversationThread>(`/messages/${selectedId}`, token as string),
    enabled: Boolean(token && selectedId),
  });

  const markRead = useMutation({
    mutationFn: (id: number) => apiPatch(`/messages/${id}/read`, {}, token as string),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['messages', role] }),
  });

  useEffect(() => {
    if (selectedId && (selected?.unread_count ?? 0) > 0) markRead.mutate(selectedId);
    // The selected conversation is the only one whose read state can change here.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.unread_count]);

  const send = useMutation({
    mutationFn: async () => {
      const body = draft.trim();
      if (!body) throw new Error('Écrivez un message avant de l’envoyer.');
      if (selectedId) return apiPost<MessageRow>(`/messages/${selectedId}/messages`, { body }, token as string);
      if (!newApplicationId) throw new Error('Choisissez une candidature.');
      const result = await apiPost<{ conversation: ConversationSummary; message: MessageRow }>('/messages', { application_id: Number(newApplicationId), body }, token as string);
      setSelectedId(result.conversation.id);
      return result.message;
    },
    onSuccess: () => {
      setDraft('');
      setNewApplicationId('');
      setError(null);
      queryClient.invalidateQueries({ queryKey: ['messages', role] });
      queryClient.invalidateQueries({ queryKey: ['message-thread', selectedId] });
    },
    onError: (reason) => setError(reason instanceof Error ? reason.message : 'Le message n’a pas pu être envoyé.'),
  });

  const availableApplications = useMemo(() => {
    const existing = new Set(rows.map((row) => row.application_id));
    return (applications.data?.data ?? []).filter((application) => !existing.has(application.id));
  }, [applications.data, rows]);

  const title = role === 'candidate' ? 'Messages avec les recruteurs' : 'Messages avec les candidats';

  return (
    <main className="mx-auto flex min-h-[calc(100vh-160px)] max-w-6xl flex-col gap-4 p-6">
      <header>
        <h1 className="text-2xl font-bold">{title}</h1>
        <p className="helper-text mt-1">Les conversations restent liées à une candidature réelle.</p>
      </header>

      {conversations.isError && <p role="alert" className="rounded-xl border border-error/30 bg-error/10 p-4 text-sm text-error">Impossible de charger les messages.</p>}

      <section className="grid min-h-[560px] flex-1 overflow-hidden rounded-xl border border-outline-variant bg-surface-container-lowest md:grid-cols-[280px_1fr]">
        <aside className="border-b border-outline-variant md:border-b-0 md:border-r">
          <div className="border-b border-outline-variant p-4">
            <p className="text-xs font-bold uppercase tracking-wider text-onSurface-variant">Conversations</p>
            <p className="mt-1 text-sm text-onSurface-variant">{rows.length} fil(s) actif(s)</p>
          </div>
          <div className="max-h-64 overflow-y-auto md:max-h-[490px]">
            {conversations.isLoading && <p className="p-4 text-sm text-onSurface-variant">Chargement…</p>}
            {!conversations.isLoading && rows.length === 0 && <p className="p-4 text-sm text-onSurface-variant">Aucune conversation pour l’instant.</p>}
            {rows.map((conversation) => (
              <button key={conversation.id} type="button" onClick={() => setSelectedId(conversation.id)} className={`w-full border-b border-outline-variant p-4 text-left transition-colors ${selectedId === conversation.id ? 'bg-primary/10' : 'hover:bg-surface-container-low'}`}>
                <div className="flex items-start justify-between gap-2">
                  <span className="truncate font-bold text-onSurface">{otherName(conversation)}</span>
                  {conversation.unread_count > 0 && <span className="rounded-full bg-primary px-2 py-0.5 text-[11px] font-bold text-onPrimary">{conversation.unread_count}</span>}
                </div>
                <span className="mt-1 block truncate text-xs text-primary">{conversation.offer_title ?? 'Candidature'}</span>
                <span className="mt-1 block truncate text-xs text-onSurface-variant">{conversation.last_message?.body ?? 'Commencer la conversation'}</span>
                <span className="mt-1 block text-[11px] text-outline">{formatDate(conversation.last_message_at)}</span>
              </button>
            ))}
          </div>
        </aside>

        <div className="flex min-h-0 flex-col">
          <div className="border-b border-outline-variant p-4">
            <p className="font-bold text-onSurface">{selected ? otherName(selected) : 'Nouvelle conversation'}</p>
            <p className="mt-1 text-xs text-onSurface-variant">{selected?.offer_title ?? 'Choisissez une candidature pour commencer'}</p>
          </div>

          <div className="flex-1 space-y-3 overflow-y-auto bg-surface-container-low p-4">
            {thread.isLoading && selectedId && <p className="text-sm text-onSurface-variant">Chargement…</p>}
            {!selectedId && <p className="py-16 text-center text-sm text-onSurface-variant">Sélectionnez un fil ou démarrez une conversation ci-dessous.</p>}
            {thread.data?.messages.map((message) => (
              <div key={message.id} className={`flex ${message.is_mine ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[82%] rounded-2xl px-4 py-3 ${message.is_mine ? 'bg-primary text-onPrimary' : 'bg-surface-container-lowest text-onSurface'}`}>
                  <p className="whitespace-pre-wrap text-sm leading-6">{message.body}</p>
                  <time className={`mt-1 block text-[11px] ${message.is_mine ? 'text-onPrimary/70' : 'text-onSurface-variant'}`}>{formatDate(message.created_at)}</time>
                </div>
              </div>
            ))}
          </div>

          {!selectedId && (
            <label className="border-t border-outline-variant px-4 pt-3">
              <span className="text-xs font-bold text-onSurface-variant">Candidature</span>
              <select value={newApplicationId} onChange={(event) => setNewApplicationId(event.target.value)} className="mt-1 h-11 w-full rounded-lg border border-outline-variant bg-surface px-3 text-sm text-onSurface focus:border-primary focus:outline-none">
                <option value="">Choisir une candidature…</option>
                {availableApplications.map((application) => {
                  const candidateName = `${application.candidate_profile?.first_name ?? ''} ${application.candidate_profile?.last_name ?? ''}`.trim();
                  return <option key={application.id} value={application.id}>{application.offer?.title ?? 'Offre'}{candidateName ? ` — ${candidateName}` : ''}</option>;
                })}
              </select>
            </label>
          )}

          <form onSubmit={(event) => { event.preventDefault(); send.mutate(); }} className="flex gap-2 border-t border-outline-variant p-4">
            <textarea value={draft} onChange={(event) => setDraft(event.target.value)} rows={2} placeholder="Écrire un message…" className="min-h-11 flex-1 resize-none rounded-lg border border-outline-variant bg-surface px-3 py-2 text-sm text-onSurface outline-none focus:border-primary" />
            <button type="submit" disabled={send.isPending || !draft.trim() || (!selectedId && !newApplicationId)} className="self-end rounded-lg bg-primary px-4 py-2 text-sm font-bold text-onPrimary transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50">
              {send.isPending ? '…' : 'Envoyer'}
            </button>
          </form>
          {error && <p role="alert" className="px-4 pb-4 text-sm text-error">{error}</p>}
        </div>
      </section>
    </main>
  );
}
