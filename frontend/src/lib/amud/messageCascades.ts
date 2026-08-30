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
 *
 * `read` représente "lu par le destinataire" — un message vient de naître,
 * donc toujours `false` à la création, quel que soit l'émetteur (avant, seuls
 * les messages candidat démarraient `read: false`, ceux de l'employeur
 * démarraient `true` par erreur, ce qui rendait tout badge "non lu" côté
 * candidat impossible à calculer — voir `unreadCountForCandidate`).
 */
export function sendMessage(conversation: Conversation, text: string, sender: MessageSender = 'employer'): Message {
  const message: Message = { id: generateId('message'), sender, text: text.trim(), createdAt: new Date().toISOString(), read: false };
  const current = conversationsCollection.getById(conversation.id);
  const messages = [...(current?.messages ?? conversation.messages), message];
  conversationsCollection.update(conversation.id, { messages, updatedAt: message.createdAt });
  if (sender === 'employer') {
    pushNotification({ scope: 'employer', title: `Message envoyé à ${conversation.candidateNom}.`, category: 'Messages', href: `/amud/entreprise/messages/${conversation.id}` });
    pushNotification({ scope: 'candidate', targetId: conversation.candidateId, title: `Nouveau message de ${CURRENT_EMPLOYER.entrepriseNom}.`, category: 'Messages', href: `/amud/candidat/messages/${conversation.id}` });
  } else {
    pushNotification({ scope: 'employer', title: `Nouveau message de ${conversation.candidateNom}.`, category: 'Messages', href: `/amud/entreprise/messages/${conversation.id}` });
  }
  return message;
}

/** Marque comme lus tous les messages d'un `sender` donné dans une conversation (ouverture de l'écran par l'autre partie). */
export function markConversationRead(conversationId: string, unreadFromSender: MessageSender) {
  const current = conversationsCollection.getById(conversationId);
  if (!current) return;
  const messages = current.messages.map((m) => (m.sender === unreadFromSender && !m.read ? { ...m, read: true } : m));
  conversationsCollection.update(conversationId, { messages });
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
