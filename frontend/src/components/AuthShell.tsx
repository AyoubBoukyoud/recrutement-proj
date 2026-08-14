import type { ReactNode } from 'react';

/**
 * L'écran d'auth/onboarding est une carte mobile de mx-auto max-w-md ; sur un
 * viewport de bureau, son ombre `shadow-subtle` ne se voit jamais parce que le
 * fond de `<body>` est exactement le même `bg-surface` que la carte — la page
 * se réduit alors à une colonne blanche perdue dans un vide identique. Ce
 * halo ne change rien en dessous de `lg` (les écrans restent plein cadre,
 * comme conçus) ; au-dessus, il donne à la carte un fond dont se détacher.
 */
export function AuthShell({ children, flush = false }: { children: ReactNode; flush?: boolean }) {
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
        <div className="lg:mx-auto lg:max-w-md lg:shadow-floating lg:ring-1 lg:ring-outline-variant">{children}</div>
      </div>
    );
  }

  return (
    <div className="lg:flex lg:min-h-screen lg:items-stretch lg:justify-center lg:bg-gradient-to-br lg:from-primary-light lg:via-surface lg:to-secondary-light/40 lg:py-10">
      <div className="lg:w-full lg:max-w-md lg:overflow-hidden lg:rounded-card lg:shadow-floating lg:ring-1 lg:ring-outline-variant">
        {children}
      </div>
    </div>
  );
}
