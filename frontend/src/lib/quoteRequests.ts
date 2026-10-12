// Formulaire « demander un devis » de la page publique /notre-entreprise —
// aucun compte derrière : comme `contactMessages.ts`, l'appel ne porte jamais
// de jeton.

import { apiPost } from '@/lib/api';

/** Les services proposés sur la page, tels que l'API les attend. */
export const QUOTE_SERVICES = ['mobile-apps', 'engineering', 'games', 'training'] as const;
export type QuoteService = (typeof QUOTE_SERVICES)[number];

export interface QuoteRequestInput {
  name: string;
  email: string;
  service: QuoteService;
  message: string;
}

export function submitQuoteRequest(input: QuoteRequestInput): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/quote-requests', input);
}
