// Contenu de la page /verification-identite, par langue. Même contrat que
// employeursContent.ts : typer sur `typeof fr` fait échouer le build si une
// traduction oublie une clé.

import type { Language } from '@/lib/types';
import fr from '@/content/candidate-verification-identite.fr.json';
import en from '@/content/candidate-verification-identite.en.json';
import de from '@/content/candidate-verification-identite.de.json';
import ar from '@/content/candidate-verification-identite.ar.json';

export type VerificationIdentiteContent = typeof fr;

export const VERIFICATION_IDENTITE: Record<Language, VerificationIdentiteContent> = { fr, en, de, ar };

export function verificationIdentiteContentFor(language: Language): VerificationIdentiteContent {
  return VERIFICATION_IDENTITE[language] ?? VERIFICATION_IDENTITE.fr;
}
