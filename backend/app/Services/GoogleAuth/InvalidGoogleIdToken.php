<?php

namespace App\Services\GoogleAuth;

use RuntimeException;

/**
 * Google answered the code exchange, but the ID token that came back is not
 * one this application may trust (bad signature, wrong issuer or audience,
 * expired, or a nonce that is not the one this browser was sent with).
 */
class InvalidGoogleIdToken extends RuntimeException {}
