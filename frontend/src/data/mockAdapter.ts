/**
 * L'adaptateur de maquettes de l'espace ops.
 *
 * Pourquoi ici plutôt qu'un dépôt par écran, comme dans user-app : les
 * vingt-six routes de cette application passent toutes par une seule instance
 * axios, et les composants sont déjà découplés du transport par react-query.
 * L'instance *est* donc la couture. Un adaptateur la remplace d'un bloc, sans
 * toucher un seul appel — et sans que le code réel bouge, il reprend la main
 * dès que VITE_USE_MOCKS retombe.
 *
 * Les gestes d'écriture modifient un état en mémoire : approuver un document,
 * répondre à une réclamation ou retirer un candidat d'une sélection doivent se
 * voir d'un appel au suivant. Tout se réinitialise au rechargement.
 */
import type { AxiosAdapter, AxiosRequestConfig, AxiosResponse } from 'axios'
import { MOCK_LATENCY_MS } from './opsConfig'
import { MOCK_CANDIDATES, MOCK_SHORTLIST, mockCandidateDetail } from './fixtures/candidates'
import { MOCK_AGENT_INFO, MOCK_AGENT_REGISTRATIONS } from './fixtures/referrals'
import { findMockAccount } from './fixtures/accounts'

/* ------------------------------------------------------------------ *
 * État mutable de la session
 *
 * Initialisé au premier appel, pas au chargement du module. Une
 * initialisation au niveau du module est un calcul que webpack ne peut pas
 * prouver sans effet de bord — il retient alors le module entier, fixtures
 * comprises, même dans un build où le drapeau des maquettes est éteint.
 * Sous forme paresseuse, la seule référence aux fixtures se trouve dans le
 * corps de `getState()`, que l'élimination de code mort peut retirer avec
 * elles. Vérifié par `npm run verify:no-mocks`.
 * ------------------------------------------------------------------ */
type State = {
  candidates: typeof MOCK_CANDIDATES
  shortlist: typeof MOCK_SHORTLIST
  agent: typeof MOCK_AGENT_INFO
  nextId: number
}

let cachedState: State | null = null

function getState(): State {
  if (!cachedState) {
    cachedState = {
      candidates: MOCK_CANDIDATES.map((c) => ({ ...c })),
      shortlist: MOCK_SHORTLIST.map((r) => ({ ...r })),
      agent: { ...MOCK_AGENT_INFO },
      nextId: 9000,
    }
  }
  return cachedState
}

const PAGE_SIZE = 15

/** La forme de pagination de Laravel, que les écrans attendent partout. */
function paginate<T>(rows: T[], page: number) {
  const start = (page - 1) * PAGE_SIZE
  return {
    data: rows.slice(start, start + PAGE_SIZE),
    current_page: page,
    last_page: Math.max(1, Math.ceil(rows.length / PAGE_SIZE)),
    total: rows.length,
  }
}

type Ctx = {
  params: Record<string, string>
  query: URLSearchParams
  body: Record<string, unknown>
}

type Handler = (ctx: Ctx) => unknown

/** `throw` d'un statut, pour que les chemins d'erreur se maquettent aussi. */
class MockHttpError extends Error {
  status: number
  payload: Record<string, unknown>

  constructor(status: number, payload: Record<string, unknown> = {}) {
    super(`Mock ${status}`)
    this.status = status
    this.payload = payload
  }
}

const numberParam = (ctx: Ctx, key = 'id') => Number(ctx.params[key])
const pageOf = (ctx: Ctx) => Number(ctx.query.get('page') ?? '1') || 1

/* ------------------------------------------------------------------ *
 * Table des routes — `:param` capture un segment.
 * ------------------------------------------------------------------ */
const routes: Array<[string, string, Handler]> = [
  /* --- Authentification --- */
  ['POST', '/auth/otp/request', () => ({ channel: 'whatsapp', resend_available_in: 30, debug_otp_code: '000000' })],
  [
    'POST',
    '/auth/otp/verify',
    (ctx) => {
      if (ctx.body.code !== '000000') throw new MockHttpError(422, { reason: 'invalid' })
      const account = findMockAccount(String(ctx.body.phone ?? ''))
      return {
        token: `mock-token-${account.id}`,
        user: { id: account.id, phone: account.phone, roles: account.roles },
      }
    },
  ],
  ['POST', '/auth/logout', () => ({})],

  /* --- Recruteur --- */
  [
    'GET',
    '/recruiter/candidates',
    (ctx) => {
      let rows = getState().candidates.filter((c) => c.submitted)
      const profession = ctx.query.get('profession')
      const language = ctx.query.get('language')
      const minLevel = ctx.query.get('cefr_level')
      const hasVideo = ctx.query.get('has_video')

      if (profession) rows = rows.filter((c) => (c.profession ?? '').toLowerCase().includes(profession.toLowerCase()))
      if (language) rows = rows.filter((c) => c.languages.some((l) => l.language === language))
      if (minLevel) rows = rows.filter((c) => c.languages.some((l) => (l.cefr_level ?? '') >= minLevel))
      if (hasVideo) rows = rows.filter((c) => c.has_video)

      return paginate(rows, pageOf(ctx))
    },
  ],
  [
    'GET',
    '/recruiter/candidates/:id',
    (ctx) => mockCandidateDetail(numberParam(ctx)) ?? (() => { throw new MockHttpError(404) })(),
  ],
  [
    'POST',
    '/recruiter/candidates/:id/contact',
    () => ({ phone: '+212 6 61 23 45 67', email: 'candidat@example.ma', revealed_at: new Date().toISOString() }),
  ],
  [
    'DELETE',
    '/recruiter/candidates/:id/shortlist',
    (ctx) => {
      const id = numberParam(ctx)
      getState().shortlist = getState().shortlist.filter((r) => r.candidate_profile_id !== id)
      const candidate = getState().candidates.find((c) => c.id === id)
      if (candidate) {
        candidate.shortlisted = false
        candidate.shortlist_stage = null
      }
      return {}
    },
  ],
  [
    'PUT',
    '/recruiter/candidates/:id/shortlist',
    (ctx) => {
      const id = numberParam(ctx)
      const candidate = getState().candidates.find((c) => c.id === id)
      const stage = (ctx.body.stage as string) ?? candidate?.shortlist_stage ?? 'saved'
      const notes = (ctx.body.notes as string) ?? null

      if (candidate) {
        candidate.shortlisted = true
        candidate.shortlist_stage = stage as never
      }

      const existing = getState().shortlist.find((r) => r.candidate_profile_id === id)
      if (existing) {
        existing.stage = stage as never
        if (ctx.body.notes !== undefined) existing.notes = notes
      }

      return {
        id,
        candidate_profile_id: id,
        stage,
        notes: existing?.notes ?? notes,
        contact_revealed_at: existing?.contact_revealed_at ?? null,
        updated_at: new Date().toISOString(),
      }
    },
  ],
  ['GET', '/recruiter/shortlist', (ctx) => paginate(getState().shortlist, pageOf(ctx))],
  [
    'GET',
    '/recruiter/shortlist/export',
    () => {
      const header = 'nom,metier,experience,disponibilite\n'
      const body = getState().shortlist
        .map((r) =>
          [r.candidate?.first_name, r.candidate?.last_name].filter(Boolean).join(' ') +
          `,${r.candidate?.profession ?? ''},${r.candidate?.years_of_experience ?? ''},${r.candidate?.availability_status ?? ''}`
        )
        .join('\n')
      return new Blob([header + body], { type: 'text/csv' })
    },
  ],

  /* --- Agent commercial --- */
  ['GET', '/referrals/agent', () => getState().agent],
  ['GET', '/referrals/agent/registrations', (ctx) => paginate(MOCK_AGENT_REGISTRATIONS, pageOf(ctx))],
  [
    'POST',
    '/referrals/agent/rotate',
    () => {
      getState().agent = {
        ...getState().agent,
        qr_code_token: `AGT-NORD-${Math.random().toString(36).slice(2, 7).toUpperCase()}`,
        previous_token_active_until: new Date(Date.now() + 7 * 86400000).toISOString(),
      }
      return getState().agent
    },
  ],
]

/* ------------------------------------------------------------------ *
 * Résolution
 * ------------------------------------------------------------------ */
function match(method: string, pathname: string) {
  for (const [routeMethod, pattern, handler] of routes) {
    if (routeMethod !== method) continue

    const patternParts = pattern.split('/').filter(Boolean)
    const pathParts = pathname.split('/').filter(Boolean)
    if (patternParts.length !== pathParts.length) continue

    const params: Record<string, string> = {}
    const matched = patternParts.every((part, i) => {
      if (part.startsWith(':')) {
        params[part.slice(1)] = pathParts[i]
        return true
      }
      return part === pathParts[i]
    })

    if (matched) return { handler, params }
  }
  return null
}

export const mockAdapter: AxiosAdapter = async (config: AxiosRequestConfig) => {
  const method = (config.method ?? 'get').toUpperCase()

  // `url` est relatif à baseURL ; on ne garde que le chemin et la requête.
  const [rawPath, rawQuery] = (config.url ?? '').split('?')
  const query = new URLSearchParams(rawQuery ?? '')
  for (const [key, value] of Object.entries(config.params ?? {})) {
    if (value !== undefined && value !== null) query.set(key, String(value))
  }

  const body: Record<string, unknown> =
    typeof config.data === 'string' ? JSON.parse(config.data || '{}') : ((config.data as Record<string, unknown>) ?? {})

  const found = match(method, rawPath)

  await new Promise((resolve) => setTimeout(resolve, MOCK_LATENCY_MS))

  const respond = (status: number, data: unknown): AxiosResponse => ({
    data,
    status,
    statusText: status === 200 ? 'OK' : 'Error',
    headers: {},
    config: config as never,
  })

  if (!found) {
    // Une route non maquettée doit être bruyante : sinon l'écran affiche un
    // vide silencieux et on croit à un bug d'interface.
    console.warn(`[maquette] route non gérée : ${method} ${rawPath}`)
    return Promise.reject(
      Object.assign(new Error(`Route de maquette absente : ${method} ${rawPath}`), {
        response: respond(404, { message: `Route de maquette absente : ${method} ${rawPath}` }),
        isAxiosError: true,
      })
    )
  }

  try {
    const data = found.handler({ params: found.params, query, body })
    return respond(200, data)
  } catch (error) {
    if (error instanceof MockHttpError) {
      return Promise.reject(
        Object.assign(new Error(error.message), {
          response: respond(error.status, error.payload),
          isAxiosError: true,
        })
      )
    }
    throw error
  }
}
