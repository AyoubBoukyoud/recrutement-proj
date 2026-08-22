/**
 * Conversation entreprise ↔ candidat (`/amud/entreprise/messages`). Les
 * messages sont imbriqués (`messages: Message[]`) plutôt qu'une collection
 * séparée — évite une jointure pour un module mock où chaque conversation a
 * une poignée de messages.
 */
export type MessageSender = 'employer' | 'candidate';

export type Message = {
  id: string;
  sender: MessageSender;
  text: string;
  createdAt: string;
  read: boolean;
};

export type Conversation = {
  id: string;
  entrepriseId: string;
  candidateId: string;
  candidateNom: string;
  offerId?: string;
  offerTitre?: string;
  messages: Message[];
  updatedAt: string;
};

export const conversationsSeed: Conversation[] = [
  {
    id: 'conversation_1',
    entrepriseId: '1',
    candidateId: 'candidate_youssefa',
    candidateNom: 'Youssef Amrani',
    offerId: '2',
    offerTitre: 'Développeur Fullstack React/Node',
    updatedAt: '2026-08-21T15:40:00.000Z',
    messages: [
      { id: 'message_1a', sender: 'employer', text: 'Bonjour Youssef, merci pour votre candidature ! Seriez-vous disponible pour un entretien technique cette semaine ?', createdAt: '2026-08-21T09:10:00.000Z', read: true },
      { id: 'message_1b', sender: 'candidate', text: 'Bonjour, avec plaisir. Je suis disponible à partir de lundi après-midi.', createdAt: '2026-08-21T10:05:00.000Z', read: true },
      { id: 'message_1c', sender: 'employer', text: 'Parfait, je vous confirme un créneau lundi 10h en visio.', createdAt: '2026-08-21T15:40:00.000Z', read: false },
    ],
  },
  {
    id: 'conversation_2',
    entrepriseId: '1',
    candidateId: 'candidate_omark',
    candidateNom: 'Omar Kadiri',
    offerId: '5',
    offerTitre: 'Ingénieur Cloud Senior',
    updatedAt: '2026-08-20T11:20:00.000Z',
    messages: [
      { id: 'message_2a', sender: 'candidate', text: 'Bonjour, je me permets de relancer suite à ma candidature envoyée la semaine dernière.', createdAt: '2026-08-20T11:20:00.000Z', read: false },
    ],
  },
  {
    id: 'conversation_3',
    entrepriseId: '1',
    candidateId: 'candidate_nadiam',
    candidateNom: 'Nadia Mansouri',
    updatedAt: '2026-08-18T08:00:00.000Z',
    messages: [
      { id: 'message_3a', sender: 'employer', text: 'Bonjour Nadia, votre profil nous intéresse pour un futur poste de Data Scientist. Seriez-vous ouverte à un échange ?', createdAt: '2026-08-18T08:00:00.000Z', read: true },
    ],
  },
];

export function getConversationsForEntreprise(entrepriseId: string, all: Conversation[] = conversationsSeed) {
  return all.filter((c) => c.entrepriseId === entrepriseId);
}

export function unreadCountForEntreprise(entrepriseId: string, all: Conversation[] = conversationsSeed): number {
  return getConversationsForEntreprise(entrepriseId, all).reduce(
    (total, c) => total + c.messages.filter((m) => m.sender === 'candidate' && !m.read).length,
    0,
  );
}
