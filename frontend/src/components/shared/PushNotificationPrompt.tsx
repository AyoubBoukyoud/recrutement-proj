'use client';

import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { usePushNotifications } from '@/lib/usePushNotifications';
import { Button } from '@/components/shared/Button';

/**
 * "Activer les notifications" — the one user-visible entry point into Web
 * Push (see `usePushNotifications`). Renders nothing once the browser
 * doesn't support it, permission was already decided, or the platform has
 * no VAPID key configured — a silent no-op rather than a broken button.
 */
export function PushNotificationPrompt() {
  const { token } = useAuth();
  const { supported, permission, subscribing, error, subscribe } = usePushNotifications(token);
  const [dismissed, setDismissed] = useState(false);

  if (!supported || permission !== 'default' || dismissed) return null;

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
