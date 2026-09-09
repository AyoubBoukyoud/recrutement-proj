/** Réexport fin — voir `centerTypes.ts` (types). État éphémère, jamais pré-seedé : créé à la volée par `startSession()`. */
export type { CenterSessionState, SessionQrStatus, QrPayload } from './centerTypes';
export const centerSessionStatesSeed: import('./centerTypes').CenterSessionState[] = [];
