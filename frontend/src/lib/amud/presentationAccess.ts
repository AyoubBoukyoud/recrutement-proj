'use client';

/**
 * Whether this browser holds a server-verified presentation grant. Prototype
 * pages and the training demo depend on it; the proxy enforces the same grant
 * on the server, so this state only drives the interface.
 */
export const PRESENTATION_EVENT = 'amud:presentation-access-change';

let granted = false;
let expiresAt: string | null = null;
let pending: Promise<void> | null = null;
let timer: ReturnType<typeof setTimeout> | undefined;

function publish(next: boolean, expiry: string | null) {
  const changed = next !== granted;
  granted = next; expiresAt = expiry;
  if (timer) clearTimeout(timer);
  if (next && expiry) {
    const delay = new Date(expiry).getTime() - Date.now();
    if (delay > 0 && delay < 2 ** 31) timer = setTimeout(() => publish(false, null), delay);
  }
  if (changed && typeof window !== 'undefined') window.dispatchEvent(new Event(PRESENTATION_EVENT));
}

export function hasPresentationAccess(): boolean { return granted; }
export function presentationExpiresAt(): string | null { return expiresAt; }

/** Test hook for the Node verification scripts; the browser path uses the server. */
export function setPresentationAccessForTesting(value: boolean) { publish(value, null); }

export async function fetchPresentationStatus(method: 'GET' | 'POST' | 'DELETE', body?: unknown) {
  const response = await fetch('/presentation-access', { method, credentials: 'same-origin', cache: 'no-store', headers: body ? { 'Content-Type': 'application/json' } : undefined, body: body ? JSON.stringify(body) : undefined });
  const data = await response.json().catch(() => ({})) as { granted?: boolean; expires_at?: string | null; message?: string };
  if (!response.ok && method === 'POST') throw new Error(data.message ?? 'Autorisation refusée.');
  publish(!!data.granted, data.expires_at ?? null);
}

/** Checks the HttpOnly grant once per page load. */
export function ensurePresentationAccess(): Promise<void> {
  if (typeof window === 'undefined') return Promise.resolve();
  pending ??= fetchPresentationStatus('GET').catch(() => publish(false, null));
  return pending;
}

export function markPresentationChecked() { pending = Promise.resolve(); }
