'use client';

import { generateId } from './storage/ids';
import { conversationsCollection } from './localConversations';
import { pushNotification } from './storage/notify';
import type { Conversation, Message, MessageSender } from '@/data/amud/conversations';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';

/**
 * Envoi de message (cahier des charges §32). `Collection.update()` fait un
 * merge superficiel — on relit donc systématiquement le tableau `messages`
 * courant avant d'y ajouter le nouveau message, pour ne jamais écraser
 * l'historique (voir `plans/nested-riding-bunny.md`, risque §6.3).
 */
export function sendMessage(conversation: Conversation, text: string, sender: MessageSender = 'employer'): Message {
  const message: Message = { id: generateId('message'), sender, text: text.trim(), createdAt: new Date().toISOString(), read: sender === 'employer' };
  const current = conversationsCollection.getById(conversation.id);
  const messages = [...(current?.messages ?? conversation.messages), message];
  conversationsCollection.update(conversation.id, { messages, updatedAt: message.createdAt });
  if (sender === 'employer') {
    pushNotification({ scope: 'employer', title: `Message envoyé à ${conversation.candidateNom}.`, category: 'Messages', href: `/amud/entreprise/messages/${conversation.id}` });
  }
  return message;
}

export function startConversation(input: { candidateId: string; candidateNom: string; offerId?: string; offerTitre?: string; text: string }): Conversation {
  const now = new Date().toISOString();
  const message: Message = { id: generateId('message'), sender: 'employer', text: input.text.trim(), createdAt: now, read: true };
  const conversation: Conversation = {
    id: generateId('conversation'),
    entrepriseId: CURRENT_EMPLOYER.entrepriseId,
    candidateId: input.candidateId,
    candidateNom: input.candidateNom,
    offerId: input.offerId,
    offerTitre: input.offerTitre,
    messages: [message],
    updatedAt: now,
  };
  conversationsCollection.add(conversation);
  return conversation;
}
