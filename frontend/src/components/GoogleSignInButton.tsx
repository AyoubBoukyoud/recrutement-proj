'use client';

/*
 * « Continuer avec Google » — une action secondaire à côté du numéro de
 * téléphone, pas à sa place : contour neutre (variante `outline` du kit), le
 * « G » multicolore de Google tel que ses consignes de marque l'exigent, et le
 * CTA plein du formulaire téléphone reste l'action principale de l'écran.
 */

import { useEffect, useState } from 'react';
import { Button } from '@/components/shared/Button';
import { useLanguage } from '@/context/LanguageContext';
import { startGoogleSignIn } from '@/lib/googleAuth';

/** Le logo officiel, inchangé (couleurs et proportions imposées par Google). */
function GoogleMark() {
  return (
    <svg aria-hidden="true" focusable="false" viewBox="0 0 48 48" className="h-5 w-5 shrink-0">
      <path fill="#EA4335" d="M24 9.5c3.54 0 6.71 1.22 9.21 3.6l6.85-6.85C35.9 2.38 30.47 0 24 0 14.62 0 6.51 5.38 2.56 13.22l7.98 6.19C12.43 13.72 17.74 9.5 24 9.5z" />
      <path fill="#4285F4" d="M46.98 24.55c0-1.57-.15-3.09-.38-4.55H24v9.02h12.94c-.58 2.96-2.26 5.48-4.78 7.18l7.73 6c4.51-4.18 7.09-10.36 7.09-17.65z" />
      <path fill="#FBBC05" d="M10.53 28.59c-.48-1.45-.76-2.99-.76-4.59s.27-3.14.76-4.59l-7.98-6.19C.92 16.46 0 20.12 0 24c0 3.88.92 7.54 2.56 10.78l7.97-6.19z" />
      <path fill="#34A853" d="M24 48c6.48 0 11.93-2.13 15.89-5.81l-7.73-6c-2.15 1.45-4.92 2.3-8.16 2.3-6.26 0-11.57-4.22-13.47-9.91l-7.98 6.19C6.51 42.62 14.62 48 24 48z" />
    </svg>
  );
}

export function GoogleSignInButton({ disabled = false }: { disabled?: boolean }) {
  const { t } = useLanguage();
  const [isRedirecting, setIsRedirecting] = useState(false);

  /*
   * Revenir de Google par le bouton « Précédent » peut restaurer cette page
   * depuis le cache de navigation, bouton encore en attente : on le rend
   * cliquable à nouveau plutôt que de le laisser bloqué.
   */
  useEffect(() => {
    const reset = (event: PageTransitionEvent) => {
      if (event.persisted) setIsRedirecting(false);
    };
    window.addEventListener('pageshow', reset);
    return () => window.removeEventListener('pageshow', reset);
  }, []);

  const onClick = () => {
    // Un seul départ : un double clic ouvrirait deux allers-retours dont le
    // second invaliderait l'état OAuth du premier.
    if (isRedirecting) return;
    setIsRedirecting(true);
    startGoogleSignIn();
  };

  return (
    <Button
      variant="outline"
      size="md"
      fullWidth
      onClick={onClick}
      disabled={disabled}
      isLoading={isRedirecting}
      loadingLabel={t('google_redirecting')}
      leadingIcon={<GoogleMark />}
      className="shadow-sm"
    >
      {t('google_continue')}
    </Button>
  );
}
