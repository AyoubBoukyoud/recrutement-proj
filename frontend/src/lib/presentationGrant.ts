/**
 * Server-side verification of a presentation grant signed by Laravel
 * (`PresentationAccessController`). Used by the proxy and the
 * `/presentation-access` route handler; never shipped to the browser with a secret.
 */
export const PRESENTATION_COOKIE = 'amud_presentation';

export type PresentationGrant = { uid: number; exp: number };

function fromBase64url(value: string): Uint8Array {
  const base64 = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=');
  const binary = atob(base64);
  return Uint8Array.from(binary, (char) => char.charCodeAt(0));
}

/** Returns the grant when the signature and expiry are valid, otherwise null (fail closed). */
export async function verifyPresentationGrant(token: string | undefined, secret: string | undefined, now = Date.now()): Promise<PresentationGrant | null> {
  if (!token || !secret || secret.length < 32 || token.length > 512) return null;
  const [payload, signature, extra] = token.split('.');
  if (!payload || !signature || extra !== undefined) return null;
  try {
    const encoder = new TextEncoder();
    const key = await crypto.subtle.importKey('raw', encoder.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['verify']);
    const valid = await crypto.subtle.verify('HMAC', key, fromBase64url(signature) as BufferSource, encoder.encode(payload) as BufferSource);
    if (!valid) return null;
    const data = JSON.parse(new TextDecoder().decode(fromBase64url(payload))) as { v?: number; uid?: unknown; exp?: unknown };
    if (data.v !== 1 || typeof data.uid !== 'number' || typeof data.exp !== 'number' || data.exp * 1000 <= now) return null;
    return { uid: data.uid, exp: data.exp };
  } catch {
    return null;
  }
}

export function presentationSecret(): string | undefined {
  return process.env.PRESENTATION_ACCESS_SECRET;
}
