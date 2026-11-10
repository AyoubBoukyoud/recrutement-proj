<?php

namespace App\Support;

use RuntimeException;

/** A stored upload that LocalFile could not fetch from its disk. */
final class UnreadableStoredFile extends RuntimeException {}
