'use client';

import { useEffect, useState } from 'react';

/**
 * Simulates an initial page data load so skeleton loaders can display
 * while mock/local data is "fetched". Replace with real async state later.
 */
export function usePageLoading(delayMs = 0): boolean {
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const timer = window.setTimeout(() => setIsLoading(false), delayMs);
        return () => window.clearTimeout(timer);
    }, [delayMs]);

    return isLoading;
}
