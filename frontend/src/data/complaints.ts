/**
 * Réclamations candidat, en maquette ou via l'API Laravel.
 *
 * L'implémentation HTTP délègue à `lib/complaints`, qui reste la description
 * du contrat réel du back. La maquette persiste les tickets dans
 * `as_complaints` et simule une réponse support après quelques secondes,
 * pour que l'écran ait quelque chose à montrer sans attendre un vrai agent.
 */
import {
  listMyComplaints,
  submitTextComplaint,
  submitVoiceComplaint,
  markComplaintResponseSeen,
  type Complaint,
} from '@/lib/complaints';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import { fakeLatency } from './config';

export interface ComplaintsRepository {
  list(token: string): Promise<Complaint[]>;
  submitText(subject: string, message: string, token: string): Promise<Complaint>;
  submitVoice(subject: string, audio: Blob, token: string): Promise<Complaint>;
  markSeen(id: number, token: string): Promise<void>;
}

const httpComplaints: ComplaintsRepository = {
  list: listMyComplaints,
  submitText: submitTextComplaint,
  submitVoice: submitVoiceComplaint,
  markSeen: markComplaintResponseSeen,
};

/* ------------------------------------------------------------------ *
 * Maquette — persistée dans `as_complaints`.
 * ------------------------------------------------------------------ */

function seedComplaints(): Complaint[] {
  return [
    {
      id: 1,
      type: 'text',
      body: '[Question sur mon dossier] Bonjour, où en est la vérification de mon diplôme ?',
      audio_path: null,
      audio_url: null,
      status: 'resolved',
      admin_response: "Bonjour Youssef, votre diplôme a bien été vérifié et validé. Vous pouvez continuer votre dossier.",
      responded_at: '2026-08-18T10:00:00.000Z',
      responded_by: { id: 1, name: 'Support Amud' },
      has_unread_response: true,
      admin_notified_at: '2026-08-17T09:00:00.000Z',
      created_at: '2026-08-17T08:45:00.000Z',
    },
  ];
}

let store: Complaint[] | null = null;
let nextId = 1;

function complaints(): Complaint[] {
  if (store === null) {
    store = readStorage<Complaint[]>(STORAGE_KEYS.complaints, seedComplaints());
    nextId = store.length > 0 ? Math.max(...store.map((c) => c.id)) + 1 : 1;
  }
  return store;
}

function persist(next: Complaint[]) {
  store = next;
  writeStorage(STORAGE_KEYS.complaints, next);
}

function replace(id: number, patch: Partial<Complaint>) {
  persist(complaints().map((c) => (c.id === id ? { ...c, ...patch } : c)));
}

function create(base: Omit<Complaint, 'id' | 'status' | 'admin_response' | 'responded_at' | 'responded_by' | 'has_unread_response' | 'admin_notified_at' | 'created_at'>): Complaint {
  const created: Complaint = {
    ...base,
    id: nextId++,
    status: 'open',
    admin_response: null,
    responded_at: null,
    responded_by: null,
    has_unread_response: false,
    admin_notified_at: new Date().toISOString(),
    created_at: new Date().toISOString(),
  };
  persist([created, ...complaints()]);

  // Simule le passage en traitement puis une réponse support, sans backend.
  setTimeout(() => replace(created.id, { status: 'in_review' }), 4000);
  setTimeout(() => {
    replace(created.id, {
      status: 'resolved',
      admin_response: 'Merci pour votre message, notre équipe a bien pris en compte votre demande.',
      responded_at: new Date().toISOString(),
      responded_by: { id: 1, name: 'Support Amud' },
      has_unread_response: true,
    });
  }, 9000);

  return created;
}

const mockComplaints: ComplaintsRepository = {
  list: () => fakeLatency([...complaints()]),

  submitText: (subject, message) =>
    fakeLatency(
      create({
        type: 'text',
        body: `[${subject}] ${message}`,
        audio_path: null,
        audio_url: null,
      })
    ),

  submitVoice: (subject, audio) =>
    fakeLatency(
      create({
        type: 'voice',
        body: `[${subject}]`,
        audio_path: `complaints/${subject.replace(/\s+/g, '-').toLowerCase()}.webm`,
        audio_url: URL.createObjectURL(audio),
      }),
      700
    ),

  markSeen: (id) => {
    replace(id, { has_unread_response: false });
    return fakeLatency(undefined);
  },
};

export const complaintsRepository: ComplaintsRepository =
  process.env.NEXT_PUBLIC_USE_MOCKS === '1' ? mockComplaints : httpComplaints;
