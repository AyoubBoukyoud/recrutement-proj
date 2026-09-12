// Formulaire « nous contacter » du bas de la page d'accueil publique — aucun
// compte derrière : l'appel ne porte jamais de jeton, contrairement au reste
// de `src/lib/api.ts`.

import { apiPost } from '@/lib/api';

export interface ContactMessageInput {
  name: string;
  email: string;
  message: string;
}

export function submitContactMessage(input: ContactMessageInput): Promise<{ id: number }> {
  return apiPost<{ id: number }>('/contact', input);
}
