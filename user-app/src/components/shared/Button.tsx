'use client';

/*
 * Le bouton de l'espace candidat.
 *
 * Même langage que le kit ops de web-admin (`web-admin/src/components/ui.tsx`) :
 * mêmes tokens de `packages/design-tokens`, même base — inline-flex, coins au
 * rayon `pillar`, enfoncement au clic, opacité réduite à l'état désactivé. Seule
 * l'échelle diffère : ces écrans sont tactiles, leurs hauteurs partent de 40 px
 * là où le desktop se contente de 36.
 *
 * Il existe parce que 93 boutons écrits à la main s'étaient éloignés les uns des
 * autres — six rayons différents, une douzaine de hauteurs, et de l'or portant
 * du texte blanc à 2,10:1. Les variantes ci-dessous sont sémantiques : on
 * choisit ce que le bouton *fait*, pas la couleur qu'il porte.
 */

import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from 'react';

export type ButtonVariant =
  | 'primary'
  | 'secondary'
  | 'outline'
  | 'tonal'
  | 'ghost'
  | 'destructive'
  | 'destructive-ghost'
  | 'link';

export type ButtonSize = 'sm' | 'md' | 'lg';

const BASE =
  'inline-flex items-center justify-center gap-2 rounded-pillar border border-transparent font-bold ' +
  'transition-[background-color,border-color,color,opacity,transform] duration-150 ' +
  'active:enabled:scale-[0.98] ' +
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 ' +
  'focus-visible:ring-offset-surface ' +
  'disabled:cursor-not-allowed disabled:opacity-50 disabled:active:scale-100';

/**
 * L'or de la marque ne porte jamais de texte blanc : #D4AF37 sur blanc tombe à
 * 2,10:1. Le texte des boutons secondaires est donc le brun sombre du conteneur
 * or, qui tient 13,27:1.
 */
const VARIANTS: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-onPrimary hover:enabled:bg-primary-dark',
  secondary: 'bg-secondary text-on-secondary-container hover:enabled:bg-secondary-dark hover:enabled:text-onPrimary',
  outline:
    'border-outline bg-transparent text-primary hover:enabled:border-primary hover:enabled:bg-primary/5',
  /* Action secondaire posée sur une surface : un aplat neutre, un libellé teal.
     Elle accompagne une action primaire sans lui disputer l'attention. */
  tonal: 'bg-surface-container-high text-primary hover:enabled:bg-surface-container-highest',
  ghost: 'bg-transparent text-on-surface-variant hover:enabled:bg-surface-container hover:enabled:text-on-surface',
  destructive: 'bg-error text-onError hover:enabled:opacity-90',
  'destructive-ghost': 'bg-transparent text-error hover:enabled:bg-error-light',
  /* Une action écrite au fil du texte — « Vérifier », « Retour ». Elle ne prend
     ni hauteur ni fond, sans quoi elle romprait la ligne où elle se trouve. */
  link: 'bg-transparent text-primary hover:enabled:underline',
};

/* Hauteurs reprises de ce que les écrans employaient déjà : ~40, ~48 et ~56 px,
   pour que l'unification ne déplace pas la mise en page. */
const SIZES: Record<ButtonSize, string> = {
  sm: 'h-10 px-4 text-xs',
  md: 'h-12 px-5 text-sm',
  lg: 'h-14 px-6 text-sm',
};

/** Hauteur et rembourrage n'ont pas de sens pour une action au fil du texte. */
const LINK_SIZES: Record<ButtonSize, string> = {
  sm: 'text-xs',
  md: 'text-sm',
  lg: 'text-base',
};

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Occupe toute la largeur — le cas des appels à l'action en bas d'écran. */
  fullWidth?: boolean;
  /** Coins entièrement arrondis, pour les boutons-pilules. */
  pill?: boolean;
  /**
   * Affiche un indicateur et désactive le bouton. `loadingLabel` remplace le
   * libellé pendant l'attente ; sans lui, le libellé d'origine est conservé.
   */
  isLoading?: boolean;
  loadingLabel?: ReactNode;
  /** Élément placé avant le libellé — une icône, en général. */
  leadingIcon?: ReactNode;
  /** Élément placé après le libellé. */
  trailingIcon?: ReactNode;
}

/** L'indicateur d'attente : un anneau, sans dépendance ni police d'icônes. */
function Spinner() {
  return (
    <span
      aria-hidden="true"
      className="h-4 w-4 shrink-0 animate-spin rounded-full border-2 border-current border-t-transparent"
    />
  );
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(function Button(
  {
    variant = 'primary',
    size = 'md',
    fullWidth = false,
    pill = false,
    isLoading = false,
    loadingLabel,
    leadingIcon,
    trailingIcon,
    className = '',
    disabled,
    children,
    type = 'button',
    ...props
  },
  ref
) {
  return (
    <button
      ref={ref}
      // Un bouton sans `type` explicite vaut `submit` dans un formulaire et en
      // soumet un au moindre clic ; le défaut sûr est `button`.
      type={type}
      // `aria-busy` dit aux lecteurs d'écran que l'attente est en cours, ce que
      // l'anneau ne leur apprend pas.
      aria-busy={isLoading || undefined}
      disabled={disabled || isLoading}
      className={[
        BASE,
        VARIANTS[variant],
        variant === 'link' ? LINK_SIZES[size] : SIZES[size],
        pill ? 'rounded-full' : '',
        fullWidth ? 'w-full' : '',
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {isLoading ? <Spinner /> : leadingIcon}
      {isLoading && loadingLabel !== undefined ? loadingLabel : children}
      {!isLoading && trailingIcon}
    </button>
  );
});

/* ------------------------------------------------------------------ *
 * Bouton d'icône
 * ------------------------------------------------------------------ */

export type IconButtonVariant = 'primary' | 'ghost' | 'surface' | 'destructive-ghost';

const ICON_VARIANTS: Record<IconButtonVariant, string> = {
  primary: 'bg-primary text-onPrimary hover:enabled:bg-primary-dark',
  ghost: 'bg-transparent text-on-surface-variant hover:enabled:bg-surface-container hover:enabled:text-on-surface',
  surface: 'bg-surface-container-lowest text-primary shadow-soft hover:enabled:bg-surface-container',
  'destructive-ghost': 'bg-transparent text-outline hover:enabled:bg-error-light hover:enabled:text-error',
};

const ICON_SIZES: Record<ButtonSize, string> = {
  sm: 'h-8 w-8',
  md: 'h-10 w-10',
  lg: 'h-12 w-12',
};

export interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: IconButtonVariant;
  size?: ButtonSize;
  /**
   * Obligatoire : un bouton qui ne porte qu'un pictogramme n'a pas de nom
   * accessible sans lui, et reste muet pour un lecteur d'écran.
   */
  'aria-label': string;
}

export const IconButton = forwardRef<HTMLButtonElement, IconButtonProps>(function IconButton(
  { variant = 'ghost', size = 'md', className = '', type = 'button', children, ...props },
  ref
) {
  return (
    <button
      ref={ref}
      type={type}
      className={[
        'inline-flex shrink-0 items-center justify-center rounded-full',
        'transition-[background-color,color,transform] duration-150 active:enabled:scale-95',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        'focus-visible:ring-offset-surface disabled:cursor-not-allowed disabled:opacity-50',
        ICON_VARIANTS[variant],
        ICON_SIZES[size],
        className,
      ]
        .filter(Boolean)
        .join(' ')}
      {...props}
    >
      {children}
    </button>
  );
});
