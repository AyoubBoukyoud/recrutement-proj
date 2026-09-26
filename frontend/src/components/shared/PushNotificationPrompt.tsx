'use client';

import { useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { isStandalone, isIos, isMobileDevice, type BeforeInstallPromptEvent } from '@/lib/pwaInstall';
import { Button } from '@/components/shared/Button';

/**
 * "Activer les notifications" — the one user-visible entry point into Web
 * Push (see `usePushNotifications`). Renders nothing once the browser
 * doesn't support it, permission was already decided, or the platform has
 * no VAPID key configured — a silent no-op rather than a broken button.
 *
 * On a mobile browser tab (not installed to the home screen), Web Push
 * either doesn't exist at all (iOS Safari) or is unreliable, so instead of
 * offering a button that silently fails, this steers the user to install
 * the app first. When there's no way to help with that either (no captured
 * `beforeinstallprompt`, and not iOS), it just stays hidden.
 */
export function PushNotificationPrompt() {
  const { token } = useAuth();
  const { supported, permission, subscribing, error, subscribe } = usePushNotifications(token);
  const [dismissed, setDismissed] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [installing, setInstalling] = useState(false);

  const needsInstallFirst = isMobileDevice() && !isStandalone();

  useEffect(() => {
    if (!needsInstallFirst || isIos()) return;
    const handler = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [needsInstallFirst]);

  if (dismissed) return null;

  if (needsInstallFirst) {
    if (!isIos() && !deferredPrompt) return null;

    const installNow = async () => {
      if (!deferredPrompt) return;
      setInstalling(true);
      try {
        await deferredPrompt.prompt();
        await deferredPrompt.userChoice;
        setDeferredPrompt(null);
      } finally {
        setInstalling(false);
      }
    };

    return (
      <div className="mb-4 flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-4">
        <span className="material-symbols-outlined mt-0.5 text-primary" aria-hidden="true">
          install_mobile
        </span>
        <div className="min-w-0 flex-1">
          <p className="font-bold text-onSurface">Installez l’application pour activer les notifications</p>
          <p className="helper-text mt-0.5">
            {isIos()
              ? 'Appuyez sur Partager, puis « Sur l’écran d’accueil » pour installer l’application.'
              : 'Les notifications nécessitent que l’application soit installée sur votre écran d’accueil.'}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {!isIos() && (
              <Button size="sm" disabled={installing} onClick={() => installNow()}>
                {installing ? 'Installation…' : 'Installer'}
              </Button>
            )}
            <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
              Plus tard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  if (!supported || permission !== 'default') return null;

  return (
    <div className="mb-4 flex items-start gap-3 rounded-xl border border-outline-variant bg-surface-lowest p-4">
      <span className="material-symbols-outlined mt-0.5 text-primary" aria-hidden="true">
        notifications_active
      </span>
      <div className="min-w-0 flex-1">
        <p className="font-bold text-onSurface">Activer les notifications</p>
        <p className="helper-text mt-0.5">
          Soyez averti·e dès qu’un recruteur répond à votre candidature, sans avoir à rouvrir l’application.
        </p>
        {error ? (
          <p role="alert" className="mt-1 text-[13px] text-error">
            {error}
          </p>
        ) : null}
        <div className="mt-3 flex flex-wrap gap-2">
          <Button size="sm" disabled={subscribing} onClick={() => subscribe()}>
            {subscribing ? 'Activation…' : 'Autoriser les notifications'}
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setDismissed(true)}>
            Plus tard
          </Button>
        </div>
      </div>
    </div>
  );
}
