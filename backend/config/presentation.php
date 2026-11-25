<?php

/*
 * Presentation (prototype) access. An administrator explicitly opens a
 * presentation; Laravel signs a short-lived grant that the Next.js server
 * verifies with the same secret before serving prototype pages. Without a
 * secret no grant can be issued, so prototypes stay closed (fail closed).
 */
return [
    'secret' => env('PRESENTATION_ACCESS_SECRET'),
    'ttl_minutes' => (int) env('PRESENTATION_ACCESS_TTL_MINUTES', 240),
];
