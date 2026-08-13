import axios from 'axios'

/**
 * The auth endpoints answer a refusal with more than a message — how long the
 * cooldown has left, how many guesses remain — and that is exactly what the
 * operator needs. Falling back to a generic sentence throws it away.
 */
export function apiErrorMessage(error: unknown, fallback: string): string {
  if (!axios.isAxiosError(error)) return fallback
  if (!error.response) return 'No connection to the API — check that the backend is running.'

  const data = error.response.data as Record<string, unknown> | undefined
  const validation = data?.errors as Record<string, string[]> | undefined
  const firstValidation = validation ? Object.values(validation)[0]?.[0] : undefined

  return firstValidation ?? (typeof data?.message === 'string' ? data.message : fallback)
}
