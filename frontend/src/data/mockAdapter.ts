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
import {
  MOCK_ADMIN_CANDIDATES,
  MOCK_ADMIN_USERS,
  MOCK_COMPLAINTS,
  MOCK_METRICS,
  MOCK_ROLES,
  MOCK_TASKS,
  mockAdminCandidateDetail,
} from './fixtures/admin'
import { MOCK_AGENT_INFO, MOCK_AGENT_REGISTRATIONS, MOCK_PAYOUTS } from './fixtures/referrals'
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
  adminCandidates: typeof MOCK_ADMIN_CANDIDATES
  complaints: typeof MOCK_COMPLAINTS
  tasks: typeof MOCK_TASKS
  users: typeof MOCK_ADMIN_USERS
  payouts: typeof MOCK_PAYOUTS
  agent: typeof MOCK_AGENT_INFO
  nextId: number
}

let cachedState: State | null = null

function getState(): State {
  if (!cachedState) {
    cachedState = {
      candidates: MOCK_CANDIDATES.map((c) => ({ ...c })),
      shortlist: MOCK_SHORTLIST.map((r) => ({ ...r })),
      adminCandidates: MOCK_ADMIN_CANDIDATES.map((c) => ({ ...c })),
      complaints: MOCK_COMPLAINTS.map((c) => ({ ...c })),
      tasks: MOCK_TASKS.map((t) => ({ ...t })),
      users: MOCK_ADMIN_USERS.map((u) => ({ ...u })),
      payouts: MOCK_PAYOUTS.map((p) => ({ ...p })),
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

  /* --- Administration --- */
  ['GET', '/admin/ping', () => ({ ok: true, message: 'maquette active', time: new Date().toISOString() })],
  ['GET', '/admin/metrics', () => MOCK_METRICS],
  ['GET', '/admin/roles', () => MOCK_ROLES],

  [
    'GET',
    '/admin/candidates',
    (ctx) => {
      const q = (ctx.query.get('q') ?? '').toLowerCase()
      const status = ctx.query.get('status')
      let rows = getState().adminCandidates
      if (q) rows = rows.filter((c) => (c.name ?? '').toLowerCase().includes(q) || c.phone.includes(q))
      if (status === 'verified') rows = rows.filter((c) => c.verified_at)
      if (status === 'submitted') rows = rows.filter((c) => c.submitted_at && !c.verified_at)
      if (status === 'draft') rows = rows.filter((c) => !c.submitted_at)
      return paginate(rows, pageOf(ctx))
    },
  ],
  [
    'GET',
    '/admin/candidates/:id',
    (ctx) => mockAdminCandidateDetail(numberParam(ctx)) ?? (() => { throw new MockHttpError(404) })(),
  ],
  [
    'PATCH',
    '/admin/candidates/:id',
    (ctx) => {
      const id = numberParam(ctx)
      const row = getState().adminCandidates.find((c) => c.id === id)
      if (!row) throw new MockHttpError(404)
      if ('verified' in ctx.body) row.verified_at = ctx.body.verified ? new Date().toISOString() : null
      return { ...mockAdminCandidateDetail(id), admin_notes: ctx.body.admin_notes ?? null }
    },
  ],
  [
    'DELETE',
    '/admin/candidates/:id',
    (ctx) => {
      const id = numberParam(ctx)
      const state = getState()
      if (!state.adminCandidates.some((c) => c.id === id)) throw new MockHttpError(404)
      state.adminCandidates = state.adminCandidates.filter((c) => c.id !== id)
      return {}
    },
  ],
  [
    'PATCH',
    '/admin/documents/:id/approval',
    (ctx) => ({
      id: numberParam(ctx),
      approval_status: ctx.body.approval_status ?? 'approved',
      rejection_reason: ctx.body.rejection_reason ?? null,
      reviewed_at: new Date().toISOString(),
      reviewed_by: { id: 301, name: 'Administrateur' },
    }),
  ],

  [
    'GET',
    '/admin/complaints',
    (ctx) => {
      const status = ctx.query.get('status')
      const rows = status ? getState().complaints.filter((c) => c.status === status) : getState().complaints
      return paginate(rows, pageOf(ctx))
    },
  ],
  [
    'PATCH',
    '/admin/complaints/:id',
    (ctx) => {
      const complaint = getState().complaints.find((c) => c.id === numberParam(ctx))
      if (!complaint) throw new MockHttpError(404)
      if (typeof ctx.body.status === 'string') complaint.status = ctx.body.status as typeof complaint.status
      if (typeof ctx.body.admin_response === 'string') {
        complaint.admin_response = ctx.body.admin_response
        complaint.responded_at = new Date().toISOString()
        complaint.responded_by = { id: 301, name: 'Administrateur', phone: '+212600000004' }
      }
      return complaint
    },
  ],

  [
    'GET',
    '/admin/tasks',
    (ctx) => {
      const includeInactive = ctx.query.get('include_inactive') === 'true' || ctx.query.get('include_inactive') === '1'
      const rows = includeInactive ? getState().tasks : getState().tasks.filter((t) => t.is_active)
      return paginate(rows, pageOf(ctx))
    },
  ],
  [
    'POST',
    '/admin/tasks',
    (ctx) => {
      const task = {
        id: getState().nextId++,
        title: String(ctx.body.title ?? 'Nouvelle tâche'),
        description: (ctx.body.description as string) ?? null,
        category: (ctx.body.category as never) ?? 'other',
        estimated_minutes: Number(ctx.body.estimated_minutes ?? 20),
        is_active: true,
        assignments_count: 0,
      }
      getState().tasks = [task, ...getState().tasks]
      return task
    },
  ],
  [
    'PATCH',
    '/admin/tasks/:id',
    (ctx) => {
      const task = getState().tasks.find((t) => t.id === numberParam(ctx))
      if (!task) throw new MockHttpError(404)
      Object.assign(task, ctx.body)
      return task
    },
  ],
  [
    'DELETE',
    '/admin/tasks/:id',
    (ctx) => {
      const task = getState().tasks.find((t) => t.id === numberParam(ctx))
      if (!task) throw new MockHttpError(404)
      task.is_active = false
      return task
    },
  ],
  [
    'POST',
    '/admin/candidates/:id/assignments',
    (ctx) => {
      const taskIds = (ctx.body.task_ids as number[]) ?? []
      return taskIds.map((taskId) => ({
        id: getState().nextId++,
        task_id: taskId,
        assigned_for: ctx.body.assigned_for,
        status: 'assigned',
      }))
    },
  ],
  ['DELETE', '/admin/assignments/:id', () => ({})],

  ['GET', '/admin/users', (ctx) => paginate(getState().users, pageOf(ctx))],
  [
    'PATCH',
    '/admin/users/:id/roles',
    (ctx) => {
      const user = getState().users.find((u) => u.id === numberParam(ctx))
      if (!user) throw new MockHttpError(404)
      user.roles = (ctx.body.roles as string[]) ?? []
      return user
    },
  ],

  ['GET', '/admin/referrals', (ctx) => paginate(getState().payouts, pageOf(ctx))],
  [
    'PATCH',
    '/admin/referrals/:id',
    (ctx) => {
      const payout = getState().payouts.find((p) => p.id === numberParam(ctx))
      if (!payout) throw new MockHttpError(404)
      Object.assign(payout, ctx.body)
      if (ctx.body.commission_status === 'paid') payout.paid_at = new Date().toISOString()
      return payout
    },
  ],

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
