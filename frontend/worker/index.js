/*
 * Additions to the auto-generated service worker (`public/sw.js`) —
 * `next-pwa` bundles this file and `importScripts`s it into that worker
 * automatically because it lives in `worker/` (its default `customWorkerDir`).
 * Everything Workbox does (precaching, the offline fallback) still happens in
 * the generated worker; this only adds what it doesn't: reacting to a push
 * message and to the user clicking the resulting system notification.
 */

self.addEventListener('push', (event) => {
  let data = { title: 'Amud Skills', body: '' };
  try {
    if (event.data) data = { ...data, ...event.data.json() };
  } catch {
    // A push with no JSON body (or a provider that sends plain text) still
    // shows something rather than throwing and dropping the notification.
    if (event.data) data.body = event.data.text();
  }

  event.waitUntil(
    self.registration.showNotification(data.title, {
      body: data.body,
      icon: '/assets/images/logo.png',
      badge: '/assets/images/logo.png',
      data: { url: data.link || '/' },
    }),
  );
});

self.addEventListener('notificationclick', (event) => {
  event.notification.close();
  const url = event.notification.data?.url || '/';

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        if (client.url.includes(url) && 'focus' in client) return client.focus();
      }
      if (self.clients.openWindow) return self.clients.openWindow(url);
    }),
  );
});
