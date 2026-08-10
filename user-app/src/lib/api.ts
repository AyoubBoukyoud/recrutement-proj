// Client HTTP minimal vers l'API Laravel. Volontairement réduit à ce dont
// l'authentification a besoin : le reste de l'application lit encore mockData.

export const API_BASE_URL = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:8000/api').replace(/\/+$/, '');

/**
 * Une réponse non-2xx, ou l'impossibilité de joindre l'API (status 0).
 * `payload` conserve le corps JSON tel quel : le back y place par exemple
 * `retry_after` sur un 429.
 */
export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly payload: Record<string, unknown> = {}
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** Secondes avant une nouvelle tentative, quand le back en annonce. */
  get retryAfter(): number | null {
    const value = this.payload.retry_after ?? this.payload.resend_available_in;
    return typeof value === 'number' ? value : null;
  }

  /** Vrai quand la requête n'est jamais partie — hors-ligne, API éteinte. */
  get isNetworkFailure(): boolean {
    return this.status === 0;
  }
}

export async function apiPost<T>(path: string, body: unknown, token?: string | null): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    Accept: 'application/json',
  };

  if (token) headers.Authorization = `Bearer ${token}`;

  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
    });
  } catch (cause) {
    throw new ApiError(0, cause instanceof Error ? cause.message : 'Network request failed');
  }

  // 204, ou une passerelle qui renvoie du HTML : ne pas faire échouer le parse.
  const raw = await response.text();
  let payload: Record<string, unknown> = {};

  if (raw) {
    try {
      payload = JSON.parse(raw) as Record<string, unknown>;
    } catch {
      payload = {};
    }
  }

  if (!response.ok) {
    const message = typeof payload.message === 'string' ? payload.message : `HTTP ${response.status}`;
    throw new ApiError(response.status, message, payload);
  }

  return payload as T;
}
