import Link from 'next/link';

// Une seule action principale sur toute la page, un seul libellé : « Créer mon
// dossier ». Trois formulations différentes de la même action donneraient
// l'impression de trois actions.

const SIZES = {
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
} as const;

interface CtaProps {
  href: string;
  children: React.ReactNode;
  size?: keyof typeof SIZES;
  className?: string;
  /** Sur fond sombre (section recruteur), le contraste s'inverse. */
  onDark?: boolean;
}

export function PrimaryCta({ href, children, size = 'md', className = '', onDark = false }: CtaProps) {
  const tone = onDark
    ? 'bg-surface-lowest text-primary-dark hover:bg-surface-container'
    : 'bg-primary text-on-primary hover:bg-primary-dark';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow-soft transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary active:scale-[0.99] ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostCta({ href, children, size = 'md', className = '', onDark = false }: CtaProps) {
  const tone = onDark
    ? 'border-surface-lowest/30 text-surface-lowest hover:bg-surface-lowest/10'
    : 'border-outline-variant text-onSurface hover:bg-surface-container';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
