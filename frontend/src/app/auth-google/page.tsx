'use client';

// Retour de « Continuer avec Google » : Laravel renvoie ici avec le résultat
// dans le fragment d'URL (#code=… / #link=… / #error=…). Écran de transit :
// il ouvre la session puis redirige comme après un code OTP.

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth, type AuthFailure } from '@/context/AuthContext';
import { useProfile } from '@/context/ProfileContext';
import { useLanguage } from '@/context/LanguageContext';
import { AuthShell } from '@/components/AuthShell';
import { destinationForRole } from '@/lib/roleDestination';
import {
  asGoogleFailure,
  consumeGoogleFlow,
  savePendingGoogleLink,
  type GoogleFailure,
} from '@/lib/googleAuth';

const FAILURE_FROM_EXCHANGE: Partial<Record<AuthFailure, GoogleFailure>> = {
  blocked: 'blocked',
  network: 'network',
  expired: 'expired',
  invalid: 'expired',
};

export default function AuthGooglePage() {
  const router = useRouter();
  const { signInWithGoogleCode } = useAuth();
  const { getIncompleteStep } = useProfile();
  const { t } = useLanguage();
  // Le code d'échange est à usage unique : le double montage du mode strict
  // ne doit pas le dépenser deux fois.
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const params = new URLSearchParams(window.location.hash.slice(1));
    // Le fragment ne quitte jamais ce navigateur, mais il resterait dans
    // l'historique : on l'efface avant toute autre chose.
    window.history.replaceState(null, '', window.location.pathname);
    const expectedFlow = consumeGoogleFlow();

    const fail = (failure: GoogleFailure) => router.replace(`/auth-phone?google_error=${failure}`);

    const error = asGoogleFailure(params.get('error'));
    if (error) {
      fail(error);
      return;
    }

    // Un résultat qui ne porte pas le `flow` de cet onglet n'a pas été
    // demandé ici : on ne s'en sert pas, quelle qu'en soit l'origine.
    if (!expectedFlow || params.get('flow') !== expectedFlow) {
      fail('expired');
      return;
    }

    const link = params.get('link');
    if (link) {
      savePendingGoogleLink({ ticket: link, email: params.get('email') ?? '' });
      router.replace('/auth-phone?google=link');
      return;
    }

    const code = params.get('code');
    if (!code) {
      fail('failed');
      return;
    }

    void signInWithGoogleCode(code).then((result) => {
      if (!result.ok) {
        fail(FAILURE_FROM_EXCHANGE[result.reason] ?? 'failed');
        return;
      }
      router.replace(
        result.deletionPending ? '/compte' : destinationForRole(result.role, getIncompleteStep()),
      );
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <AuthShell>
      <main
        id="main-content"
        tabIndex={-1}
        className="mx-auto flex min-h-screen max-w-md flex-col items-center justify-center bg-surface px-6 py-10 text-center shadow-subtle outline-none"
      >
        <span
          aria-hidden="true"
          className="mb-6 h-10 w-10 animate-spin rounded-full border-4 border-primary border-t-transparent"
        />
        <p role="status" className="text-sm font-semibold text-onSurface-variant">
          {t('google_signing_in')}
        </p>
      </main>
    </AuthShell>
  );
}
