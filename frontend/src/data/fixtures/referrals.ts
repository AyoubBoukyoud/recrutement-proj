/**
 * Parrainage : ce que l'agent commercial voit de ses inscriptions, et ce que
 * l'administrateur voit des commissions à payer. Les cinq statuts de
 * commission sont représentés — c'est ce qui fait exister chaque branche des
 * deux écrans.
 */

export const MOCK_AGENT_INFO = {
  qr_code_token: 'AGT-NORD-7K2M9',
  registrations_count: 44,
  commission_rate: 250,
  /** Un jeton précédent attribue encore : l'interface doit l'annoncer. */
  previous_token_active_until: '2026-08-19T23:59:59Z',
  grace_days: 7,
  earnings: {
    currency: 'MAD',
    registrations: 44,
    counts: { pending: 12, qualified: 9, approved: 5, paid: 16, rejected: 2 },
    owed: 3500,
    paid: 4000,
    lifetime: 7500,
  },
}

export const MOCK_AGENT_REGISTRATIONS = [
  {
    id: 1,
    candidate_name: 'Youssef Amrani',
    profession: 'Développeur Full-Stack',
    registered_at: '2026-07-29T12:00:00Z',
    commission_status: 'paid' as const,
    commission_amount: 250,
    commission_currency: 'MAD',
  },
  {
    id: 2,
    candidate_name: 'Salma Bennis',
    profession: 'Infirmière diplômée',
    registered_at: '2026-08-04T15:30:00Z',
    commission_status: 'qualified' as const,
    commission_amount: 250,
    commission_currency: 'MAD',
  },
  {
    id: 3,
    candidate_name: 'Karim El Fassi',
    profession: 'Électricien industriel',
    registered_at: '2026-08-06T10:15:00Z',
    commission_status: 'pending' as const,
    commission_amount: null,
    commission_currency: 'MAD',
  },
  {
    id: 4,
    candidate_name: null,
    profession: null,
    registered_at: '2026-08-07T08:00:00Z',
    commission_status: 'rejected' as const,
    commission_amount: null,
    commission_currency: 'MAD',
  },
  {
    id: 5,
    candidate_name: 'Nadia Cherkaoui',
    profession: 'Aide-soignante',
    registered_at: '2026-08-08T13:10:00Z',
    commission_status: 'approved' as const,
    commission_amount: 250,
    commission_currency: 'MAD',
  },
]

export const MOCK_PAYOUTS = MOCK_AGENT_REGISTRATIONS.map((row, index) => ({
  id: row.id,
  agent: index % 2 === 0 ? 'Agent Nord' : 'Agent Sud',
  candidate: row.candidate_name,
  candidate_submitted: row.commission_status !== 'pending' && row.commission_status !== 'rejected',
  registered_at: row.registered_at,
  commission_status: row.commission_status,
  commission_amount: row.commission_amount,
  commission_currency: row.commission_currency,
  qualified_at: ['qualified', 'approved', 'paid'].includes(row.commission_status)
    ? '2026-08-09T10:00:00Z'
    : null,
  paid_at: row.commission_status === 'paid' ? '2026-08-10T10:00:00Z' : null,
  payout_reference: row.commission_status === 'paid' ? 'VIR-2026-0817' : null,
}))
