// Réclamations candidat — appels à l'API Laravel et vocabulaire associé.
//
// Le back ne connaît que `type` (text|voice) et `body` — pas de sujet/catégorie
// distinct. Le sujet choisi à l'écran est donc préfixé dans `body`
// (`[Sujet] message`) plutôt qu'inventé côté backend ; `parseSubject` le relit
// à l'affichage.

import { apiGetList, apiPost } from '@/lib/api';

export type ComplaintStatus = 'open' | 'in_review' | 'resolved';

export interface Complaint {
  id: number;
  type: 'text' | 'voice';
  body: string | null;
  audio_path: string | null;
  /** URL signée de courte durée — jamais un lien public permanent. */
  audio_url: string | null;
  status: ComplaintStatus;
  admin_response: string | null;
  responded_at: string | null;
  responded_by: { id: number; name: string | null } | null;
  has_unread_response: boolean;
  admin_notified_at: string | null;
  created_at: string;
}

export function listMyComplaints(token: string): Promise<Complaint[]> {
  return apiGetList<Complaint>('/complaints', token);
}

export function submitTextComplaint(subject: string, message: string, token: string): Promise<Complaint> {
  return apiPost<Complaint>('/complaints', { type: 'text', body: `[${subject}] ${message}` }, token);
}

export function submitVoiceComplaint(subject: string, audio: Blob, token: string): Promise<Complaint> {
  const form = new FormData();
  form.append('type', 'voice');
  form.append('audio', audio, `${subject.replace(/\s+/g, '-').toLowerCase()}.webm`);

  return apiPost<Complaint>('/complaints', form, token);
}

export function markComplaintResponseSeen(id: number, token: string): Promise<void> {
  return apiPost<void>(`/complaints/${id}/seen`, {}, token);
}

/** Relit le sujet préfixé dans `body` — `null` (sujet absent) pour un message vocal. */
export function parseSubject(body: string | null): { subject: string | null; message: string } {
  if (!body) return { subject: null, message: '' };
  const match = body.match(/^\[(.+?)\]\s*([\s\S]*)$/);
  return match ? { subject: match[1], message: match[2] } : { subject: null, message: body };
}
