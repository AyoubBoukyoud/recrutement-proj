import { NextResponse, type NextRequest } from 'next/server';
import { PRESENTATION_COOKIE, presentationSecret, verifyPresentationGrant } from '@/lib/presentationGrant';

/**
 * Same-origin endpoint that turns a Laravel-signed grant into an HttpOnly cookie
 * the proxy checks on every prototype request. The browser cannot read or forge it.
 */
export const dynamic = 'force-dynamic';

function json(body: unknown, status = 200) {
  const response = NextResponse.json(body, { status });
  response.headers.set('Cache-Control', 'no-store');
  return response;
}

export async function GET(request: NextRequest) {
  const grant = await verifyPresentationGrant(request.cookies.get(PRESENTATION_COOKIE)?.value, presentationSecret());
  return json({ granted: !!grant, expires_at: grant ? new Date(grant.exp * 1000).toISOString() : null });
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null) as { grant?: unknown } | null;
  const token = typeof body?.grant === 'string' ? body.grant : undefined;
  const grant = await verifyPresentationGrant(token, presentationSecret());
  if (!grant) return json({ granted: false, message: 'Autorisation de présentation invalide ou expirée.' }, 403);
  const response = json({ granted: true, expires_at: new Date(grant.exp * 1000).toISOString() });
  response.cookies.set(PRESENTATION_COOKIE, token!, {
    httpOnly: true,
    sameSite: 'lax',
    secure: request.nextUrl.protocol === 'https:' || request.headers.get('x-forwarded-proto') === 'https',
    path: '/',
    expires: new Date(grant.exp * 1000),
  });
  return response;
}

export async function DELETE() {
  const response = json({ granted: false });
  response.cookies.set(PRESENTATION_COOKIE, '', { httpOnly: true, sameSite: 'lax', path: '/', maxAge: 0 });
  return response;
}
