import type { ReactNode } from 'react';
import { HeaderPreferences } from '@/components/shared/HeaderPreferences';
import { AuthBrandPanel } from '@/components/AuthBrandPanel';

/**
 * L'écran d'auth/onboarding est une carte mobile de mx-auto max-w-md ; sur un
 * viewport de bureau, son ombre `shadow-subtle` ne se voit jamais parce que le
 * fond de `<body>` est exactement le même `bg-surface` que la carte — la page
 * se réduit alors à une colonne blanche perdue dans un vide identique. Ce
 * halo ne change rien en dessous de `lg` (les écrans restent plein cadre,
 * comme conçus) ; au-dessus, il donne à la carte un fond dont se détacher.
 */
export function AuthShell({
  children,
  flush = false,
  split = false,
}: {
  children: ReactNode;
  flush?: boolean;
  split?: boolean;
}) {
  /*
   * `split` sert le parcours de connexion (/auth-phone, /otp) : à partir de
   * `lg`, la colonne de marque (photo + promesse) occupe une moitié et le
   * formulaire l'autre, au lieu d'une carte étroite perdue au centre d'un
   * fond vide. La grille suit le sens de lecture : en arabe, la photo passe
   * à droite. Sous `lg`, rien ne change : une colonne plein écran.
   */
  if (split) {
    return (
      <div className="min-h-[100dvh] bg-surface lg:grid lg:grid-cols-2 xl:grid-cols-[minmax(0,7fr)_minmax(0,6fr)]">
        <AuthBrandPanel />
        <div className="relative flex min-h-[100dvh] min-w-0 flex-col">
          <HeaderPreferences className="absolute end-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] rounded-full bg-surface-container-lowest p-0.5 shadow-soft lg:end-6 lg:top-6 lg:shadow-none" />
          {children}
        </div>
      </div>
    );
  }

  /*
   * `flush` sert les écrans dont le pied est `fixed inset-x-0 bottom-0`
   * (le CTA collant de profile-creation) : ce pied s'ancre au vrai bas du
   * viewport, pas à celui d'un parent. Le rembourrage et le
   * `overflow-hidden` de la variante « carte flottante » ci-dessous
   * rognaient alors visuellement `<main>` avant ce point d'ancrage, avec le
   * bouton qui semblait flotter sous la carte. `flush` n'ajoute donc ni
   * hauteur ni découpe : `<main>` garde exactement son `min-h-screen`
   * d'origine, le halo n'habille que ses côtés.
   */
  if (flush) {
    return (
      <div className="lg:min-h-screen lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40">
        <div className="relative lg:mx-auto lg:max-w-md lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
          <HeaderPreferences className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] rounded-full bg-surface/90 p-0.5 backdrop-blur-md" />
          {children}
        </div>
      </div>
    );
  }

  /*
   * Carte centrée verticalement plutôt qu'étirée : un écran qui garde son
   * `min-h-screen` au-dessus de `lg` reste pleine hauteur comme avant, et un
   * écran qui le lève (`lg:min-h-0`, /auth-phone) prend la hauteur de son
   * contenu au lieu de flotter au milieu d'une colonne vide.
   */
  return (
    <div className="lg:flex lg:min-h-screen lg:items-center lg:justify-center lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40 lg:py-10">
      <div className="relative lg:w-full lg:max-w-md lg:overflow-hidden lg:rounded-card lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        <HeaderPreferences className="absolute right-2 top-[max(0.5rem,env(safe-area-inset-top))] z-[70] rounded-full bg-surface/90 p-0.5 backdrop-blur-md" />
        {children}
      </div>
    </div>
  );
}
