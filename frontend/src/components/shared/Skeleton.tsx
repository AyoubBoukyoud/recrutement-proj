/*
 * Primitive de squelette de chargement — un simple bloc qui pulse.
 *
 * Contrairement à `SkeletonLoader` (variantes toutes faites : texte/carte/
 * avatar/liste), ce composant ne porte aucune mise en page : chaque
 * `loading.tsx` de route le compose librement (taille, forme, disposition)
 * pour reproduire le gabarit exact de sa page — c'est ce qui permet au
 * squelette d'avoir « la forme » de la page qu'il précède, comme demandé.
 *
 * `tone="amud"` bascule sur la palette namespacée `amud-*` (packages
 * `/amud/*`), qui n'a pas les mêmes classes de couleur que le reste du
 * produit (cf. tailwind.config.js).
 */

interface SkeletonProps {
  className?: string;
  tone?: 'default' | 'amud';
  /** Texte lu par les lecteurs d'écran pendant le chargement — à poser une seule fois par page, sur le squelette racine. */
  label?: string;
}

const TONE_BG: Record<'default' | 'amud', string> = {
  default: 'bg-surface-container-high',
  amud: 'bg-amud-surface-container-high',
};

export function Skeleton({ className = '', tone = 'default', label }: SkeletonProps) {
  return <div role={label ? 'status' : undefined} aria-label={label} className={`animate-pulse rounded-md ${TONE_BG[tone]} ${className}`} />;
}

/** Conteneur racine d'une page squelette : porte le rôle d'attente pour toute la page en une seule annonce. */
export function SkeletonPage({ className = '', label = 'Chargement de la page…', children }: { className?: string; label?: string; children: React.ReactNode }) {
  return (
    <div role="status" aria-busy="true" aria-label={label} className={className}>
      {children}
    </div>
  );
}
