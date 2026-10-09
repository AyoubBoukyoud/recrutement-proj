/**
 * Deux initiales pour un avatar (« Amine Alami » → « AA »).
 *
 * Tolère l'absence de nom : un compte créé avec Google n'a ni téléphone ni nom
 * tant que son dossier n'est pas rempli, et un avatar ne doit jamais faire
 * tomber toute la page.
 */
export function initials(name: string | null | undefined): string {
  const letters = (name ?? '')
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
  return letters || '?';
}
