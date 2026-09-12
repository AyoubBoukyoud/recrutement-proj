import Link from 'next/link';
import type { ReactNode } from 'react';

/**
 * Primitives partagées par la refonte de la page d'accueil publique
 * (maquette navy/corail). Les couleurs `home-*` sont des rôles sémantiques
 * pilotés par le thème global dans `globals.css`.
 */

export function Icon({ name, className = '' }: { name: string; className?: string }) {
  return (
    <span className={`material-symbols-outlined ${className}`} aria-hidden="true">
      {name}
    </span>
  );
}

const EYEBROW_TONES = {
  coral: 'bg-home-coral-soft text-home-coral-dark',
  ink: 'bg-home-ink/[0.06] text-home-ink',
  white: 'bg-white/10 text-white',
} as const;

export function Eyebrow({
  children,
  tone = 'coral',
  className = '',
}: {
  children: ReactNode;
  tone?: keyof typeof EYEBROW_TONES;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.14em] ${EYEBROW_TONES[tone]} ${className}`}
    >
      <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-current" />
      {children}
    </span>
  );
}

export function SectionHeading({
  eyebrow,
  title,
  subtitle,
  align = 'start',
  tone = 'ink',
  className = '',
}: {
  eyebrow?: string;
  title: string;
  subtitle?: string;
  align?: 'start' | 'center';
  tone?: 'ink' | 'white';
  className?: string;
}) {
  const centered = align === 'center';
  return (
    <div className={`${centered ? 'mx-auto max-w-2xl text-center' : 'max-w-2xl'} ${className}`}>
      {eyebrow ? <Eyebrow tone={tone === 'white' ? 'white' : 'coral'}>{eyebrow}</Eyebrow> : null}
      <h2
        className={`mt-4 text-3xl font-bold leading-tight tracking-tight sm:text-4xl ${
          tone === 'white' ? 'text-white' : 'text-home-ink'
        }`}
      >
        {title}
      </h2>
      {subtitle ? (
        <p className={`mt-4 text-base leading-relaxed sm:text-lg ${tone === 'white' ? 'text-white/75' : 'text-home-slate'}`}>
          {subtitle}
        </p>
      ) : null}
    </div>
  );
}

const BTN_SIZES = {
  sm: 'px-4 py-2 text-xs sm:text-sm',
  md: 'px-6 py-3 text-sm',
  lg: 'px-8 py-4 text-base',
} as const;

interface HomeBtnProps {
  href: string;
  children: ReactNode;
  size?: keyof typeof BTN_SIZES;
  className?: string;
  /** Sur fond sombre (final CTA, cartes navy). */
  onDark?: boolean;
}

/** Action principale : corail plein. Sur fond sombre, blanc plein — un aplat corail sur navy perdrait le contraste voulu par la maquette. */
export function CoralButton({ href, children, size = 'md', className = '', onDark = false }: HomeBtnProps) {
  const tone = onDark ? 'bg-white text-home-strong hover:bg-white/90' : 'bg-home-coral text-white hover:bg-home-coral-hover';
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-2 rounded-xl font-bold shadow-[0_8px_24px_rgba(241,105,63,0.25)] transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-coral active:scale-[0.99] ${tone} ${BTN_SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}

/** Action secondaire : contour. */
export function OutlineButton({ href, children, size = 'md', className = '', onDark = false }: HomeBtnProps) {
  const tone = onDark
    ? 'border-white/30 text-white hover:bg-white/10'
    : 'border-home-ink/15 text-home-ink hover:bg-home-ink/5';
  return (
    <Link
      href={href}
      className={`inline-flex items-center justify-center gap-1.5 rounded-xl border font-semibold transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-home-coral ${tone} ${BTN_SIZES[size]} ${className}`}
    >
      {children}
    </Link>
  );
}
