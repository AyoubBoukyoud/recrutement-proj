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
];
