'use client';

import { useCallback, useEffect, useState } from 'react';
import { apiDelete, apiPost } from '@/lib/api';

/*
 * Browser Web Push, wired to `POST/DELETE /push/subscriptions` (see
 * `PushSubscriptionController`). The service worker that actually shows the
 * notification lives at `worker/index.js`; `next-pwa` bundles it into
 * `public/sw.js`, which the PWA plugin only registers outside `next dev`
 * (see `next.config.mjs`), so this hook's `supported` check on
 * `navigator.serviceWorker` will read false in local dev.
 */
export type PushPermission = 'default' | 'granted' | 'denied' | 'unsupported';

function urlBase64ToUint8Array(base64: string): BufferSource {
  const padding = '='.repeat((4 - (base64.length % 4)) % 4);
  const base64Safe = (base64 + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64Safe);
  return Uint8Array.from(raw.split('').map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(token: string | null) {
  const [permission, setPermission] = useState<PushPermission>('default');
  const [subscribing, setSubscribing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const supported =
    typeof window !== 'undefined' && 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;

  useEffect(() => {
    if (!supported) {
      setPermission('unsupported');
      return;
    }
    setPermission(Notification.permission as PushPermission);
  }, [supported]);

  const subscribe = useCallback(async () => {
    if (!supported || !token) return;
    const publicKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY;
    if (!publicKey) {
      setError('Notifications indisponibles pour le moment.');
      return;
    }

    setSubscribing(true);
    setError(null);
    try {
      const result = await Notification.requestPermission();
      setPermission(result);
      if (result !== 'granted') return;

      const registration = await navigator.serviceWorker.ready;
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToUint8Array(publicKey),
        }));

      await apiPost('/push/subscriptions', subscription.toJSON(), token);
    } catch {
      setError('Activation impossible. Réessayez.');
    } finally {
      setSubscribing(false);
    }
  }, [supported, token]);

  const unsubscribe = useCallback(async () => {
    if (!supported || !token) return;
    setSubscribing(true);
    try {
      const registration = await navigator.serviceWorker.ready;
      const subscription = await registration.pushManager.getSubscription();
      if (subscription) {
        // `apiDelete` sends no body — the endpoint travels as a query param,
        // which `PushSubscriptionController::destroy` reads the same way
        // (Laravel merges query + body in `$request->validate()` regardless
        // of method).
        await apiDelete(`/push/subscriptions?endpoint=${encodeURIComponent(subscription.endpoint)}`, token).catch(() => undefined);
        await subscription.unsubscribe();
      }
    } finally {
      setSubscribing(false);
    }
  }, [supported, token]);

  return { supported, permission, subscribing, error, subscribe, unsubscribe };
}
