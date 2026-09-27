import Link from 'next/link';

const SIZES = {
  sm: 'px-4 py-2 text-xs sm:text-sm',
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
    ? 'bg-white text-home-ink hover:bg-home-sand shadow-md active:scale-[0.98]'
    : 'bg-home-coral text-white shadow-soft hover:bg-home-coral-hover active:scale-[0.98]';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 min-h-[46px] rounded-pillar font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-coral ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostCta({ href, children, size = 'md', className = '', onDark = false }: CtaProps) {
  const tone = onDark
    ? 'border border-white/30 text-white hover:bg-white/10 active:scale-95'
    : 'border border-home-coral/30 bg-home-surface text-home-coral-dark hover:border-home-coral/60 hover:bg-home-coral-soft active:scale-[0.98]';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 min-h-[46px] rounded-pillar border font-bold transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-coral ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
