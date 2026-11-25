'use client';

import { apiPost } from '@/lib/api';
import { fetchPresentationStatus, markPresentationChecked } from './presentationAccess';

/** Administrator only: Laravel signs the grant, the Next server stores it as an HttpOnly cookie. */
export async function startPresentation(token: string) {
  const { grant } = await apiPost<{ grant: string; expires_at: string }>('/presentation-access', {}, token);
  await fetchPresentationStatus('POST', { grant });
  markPresentationChecked();
}

/** Revokes the grant for this browser (leaving a presentation, signing out). */
export async function endPresentation() {
  try { await fetchPresentationStatus('DELETE'); } catch { /* the cookie expires on its own */ }
  markPresentationChecked();
}
