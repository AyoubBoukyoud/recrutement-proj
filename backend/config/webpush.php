<?php

return [
    /*
     * Missing keys disable sending rather than throwing — a fresh checkout
     * with no VAPID pair configured still works end to end (in-app
     * notifications, the whole rest of the product), it just never pushes to
     * a browser. `WebPushSender::send()` checks `enabled()` before doing
     * anything.
     */
    'public_key' => env('VAPID_PUBLIC_KEY'),
    'private_key' => env('VAPID_PRIVATE_KEY'),
    'subject' => env('VAPID_SUBJECT', 'mailto:support@example.com'),

    /*
     * Where a browser may say its push service lives. The server POSTs to the
     * `endpoint` a client registers, so an unchecked value turns the push
     * sender into a way to make this host call an address of the caller's
     * choosing — the cloud metadata service, the database, the WhatsApp
     * gateway. Only the push services the browsers actually use are accepted
     * (Chrome/Edge/Opera/Samsung: FCM; Firefox: Mozilla autopush; Safari:
     * Apple; legacy Edge/Windows: WNS), always over HTTPS. Suffixes match the
     * host or any subdomain of it. WEBPUSH_ALLOWED_HOSTS replaces the list.
     */
    'allowed_hosts' => array_values(array_filter(array_map('trim', explode(',', (string) env(
        'WEBPUSH_ALLOWED_HOSTS',
        'fcm.googleapis.com,android.googleapis.com,push.services.mozilla.com,push.apple.com,notify.windows.com',
    ))))),
];
