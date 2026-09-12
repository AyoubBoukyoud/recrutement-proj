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
    ? 'bg-white text-emerald-950 hover:bg-emerald-50 shadow-md active:scale-95'
    : 'bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 text-white shadow-[0_4px_20px_rgba(16,185,129,0.3)] hover:shadow-[0_8px_30px_rgba(16,185,129,0.45)] hover:scale-[1.02] active:scale-[0.98]';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl font-black transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

export function GhostCta({ href, children, size = 'md', className = '', onDark = false }: CtaProps) {
  const tone = onDark
    ? 'border border-white/30 text-white hover:bg-white/10 active:scale-95'
    : 'border border-emerald-600/30 dark:border-white/20 bg-emerald-50/50 dark:bg-white/5 text-emerald-950 dark:text-white hover:bg-emerald-100/50 dark:hover:bg-white/10 hover:border-emerald-600/50 dark:hover:border-white/40 active:scale-95';

  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-2xl border font-black transition-all duration-200 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-emerald-500 ${tone} ${SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
