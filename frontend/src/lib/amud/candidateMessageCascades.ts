'use client';

import { generateId } from './storage/ids';
import { conversationsCollection } from './localConversations';
import { pushNotification } from './storage/notify';
import type { Conversation, Message } from '@/data/amud/conversations';

/** Démarre une conversation candidat → entreprise (ex. depuis une fiche offre) — pendant du `startConversation` de `messageCascades.ts`, côté candidat. */
export function startConversationFromCandidate(input: { candidateId: string; candidateNom: string; entrepriseId: string; offerId?: string; offerTitre?: string; text: string }): Conversation {
  const now = new Date().toISOString();
  const message: Message = { id: generateId('message'), sender: 'candidate', text: input.text.trim(), createdAt: now, read: false };
  const conversation: Conversation = {
    id: generateId('conversation'),
    entrepriseId: input.entrepriseId,
    candidateId: input.candidateId,
    candidateNom: input.candidateNom,
    offerId: input.offerId,
    offerTitre: input.offerTitre,
    messages: [message],
    updatedAt: now,
  };
  conversationsCollection.add(conversation);
  pushNotification({ scope: 'employer', title: `Nouveau message de ${input.candidateNom}.`, category: 'Messages', href: `/amud/entreprise/messages/${conversation.id}` });
  return conversation;
}
