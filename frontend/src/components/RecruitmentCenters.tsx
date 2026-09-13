'use client';

import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { apiErrorMessage } from '@/lib/apiError'
import { Badge, Button, Card, Eyebrow, Field, Notice, SectionHeader, SelectField, TextareaField } from '@/components/ui'
import { Pagination } from '@/components/Pagination'
import type { PaginatedResponse } from '@/types/candidate'

type Category = 'training_center' | 'business_germany'
type CallStatus = 'not_called' | 'no_answer' | 'called' | 'call_back'
type OfferStatus = 'pending' | 'negotiating' | 'accepted' | 'refused'

type Note = {
  id: number
  body: string
  author: string | null
  created_at: string
}

type CenterRow = {
  id: number
  name: string
  category: Category
  phone: string | null
  email: string | null
  address: string | null
  city: string | null
  contact_person: string | null
  call_status: CallStatus
  offer_status: OfferStatus
  created_by: string | null
  created_at: string
  notes_count: number
  last_note: Note | null
}

type CenterDetail = CenterRow & { notes: Note[] }

const EMPTY_FORM = {
  name: '',
  category: '' as Category | '',
  phone: '',
  email: '',
  address: '',
  city: '',
  contact_person: '',
}

const CATEGORY_LABELS: Record<Category, string> = {
  training_center: 'Centre de formation',
  business_germany: 'Entreprise (Allemagne)',
}

const CALL_STATUS_LABELS: Record<CallStatus, string> = {
  not_called: 'Pas encore appelé',
  no_answer: 'Pas de réponse',
  called: 'Appelé',
  call_back: 'À rappeler',
}

const OFFER_STATUS_LABELS: Record<OfferStatus, string> = {
  pending: 'En attente',
  negotiating: 'En négociation',
  accepted: 'Offre acceptée',
  refused: 'Offre refusée',
}

const CALL_STATUS_TONE: Record<CallStatus, 'done' | 'pending' | 'error' | 'neutral'> = {
  not_called: 'neutral',
  no_answer: 'pending',
  call_back: 'pending',
  called: 'done',
}

const OFFER_STATUS_TONE: Record<OfferStatus, 'done' | 'pending' | 'error' | 'neutral'> = {
  pending: 'neutral',
  negotiating: 'pending',
  accepted: 'done',
  refused: 'error',
}

const fmt = (iso: string) => new Date(iso).toLocaleString('fr-FR', { dateStyle: 'medium', timeStyle: 'short' })

/**
 * Le carnet de contact partagé pour les centres de recrutement/formation et
 * les entreprises allemandes démarchées — commercial et admin y voient et
 * écrivent la même chose, pour qu'un centre déjà appelé ne soit pas rappelé à
 * l'aveugle par un collègue. Un centre est un lead dès sa création : rien
 * n'est jamais « promu », call_status et offer_status avancent sur la même
 * fiche. Rendu à la fois dans l'espace commercial (AgentDashboard) et dans
 * `/admin/centres` : même composant, mêmes routes API, permissions gérées
 * côté backend (role:Administrator|Commercial Agent).
 */
export function RecruitmentCenters() {
  const qc = useQueryClient()
  const [q, setQ] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<Category | ''>('')
  const [callStatusFilter, setCallStatusFilter] = useState<CallStatus | ''>('')
  const [offerStatusFilter, setOfferStatusFilter] = useState<OfferStatus | ''>('')
  const [page, setPage] = useState(1)
  const [creating, setCreating] = useState(false)
  const [form, setForm] = useState(EMPTY_FORM)
  const [openId, setOpenId] = useState<number | null>(null)
  const [noteDraft, setNoteDraft] = useState('')

  const list = useQuery({
    queryKey: ['recruitment-centers', q, categoryFilter, callStatusFilter, offerStatusFilter, page],
    queryFn: () =>
      api
        .get('/recruitment-centers', {
          params: {
            q: q.trim() || undefined,
            category: categoryFilter || undefined,
            call_status: callStatusFilter || undefined,
            offer_status: offerStatusFilter || undefined,
            page,
          },
        })
        .then((r) => r.data as PaginatedResponse<CenterRow>),
  })

  const detail = useQuery({
    queryKey: ['recruitment-center', openId],
    queryFn: () => api.get(`/recruitment-centers/${openId}`).then((r) => r.data as CenterDetail),
    enabled: openId !== null,
  })

  const create = useMutation({
    mutationFn: () =>
      api.post('/recruitment-centers', {
        ...form,
        phone: form.phone.trim() || undefined,
        email: form.email.trim() || undefined,
        address: form.address.trim() || undefined,
        city: form.city.trim() || undefined,
        contact_person: form.contact_person.trim() || undefined,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['recruitment-centers'] })
      setForm(EMPTY_FORM)
      setCreating(false)
    },
  })

  const addNote = useMutation({
    mutationFn: ({ id, body }: { id: number; body: string }) =>
      api.post(`/recruitment-centers/${id}/notes`, { body }),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['recruitment-centers'] })
      qc.invalidateQueries({ queryKey: ['recruitment-center', id] })
      setNoteDraft('')
    },
  })

  const updateStatus = useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<{ call_status: CallStatus; offer_status: OfferStatus }> }) =>
      api.patch(`/recruitment-centers/${id}`, data),
    onSuccess: (_res, { id }) => {
      qc.invalidateQueries({ queryKey: ['recruitment-centers'] })
      qc.invalidateQueries({ queryKey: ['recruitment-center', id] })
    },
  })

  const toggleOpen = (id: number) => {
    setOpenId((current) => (current === id ? null : id))
    setNoteDraft('')
  }

  return (
    <Card>
      <SectionHeader
        eyebrow="Prospection"
        title="Centres de recrutement"
        subtitle="Un centre ou une entreprise démarchée, où en est l'appel et l'offre — visible par tous les commerciaux et l'administration."
      />

      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <input
          value={q}
          onChange={(e) => {
            setQ(e.target.value)
            setPage(1)
          }}
          placeholder="Rechercher par nom ou ville…"
          className="h-10 min-w-[160px] rounded-element border border-outline-variant bg-transparent px-3 text-sm text-on-surface outline-none focus:border-primary"
        />
        <select
          value={categoryFilter}
          onChange={(e) => {
            setCategoryFilter(e.target.value as Category | '')
            setPage(1)
          }}
          className="h-10 rounded-element border border-outline-variant bg-transparent px-3 text-sm text-on-surface outline-none focus:border-primary"
        >
          <option value="">Toutes catégories</option>
          {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={callStatusFilter}
          onChange={(e) => {
            setCallStatusFilter(e.target.value as CallStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-element border border-outline-variant bg-transparent px-3 text-sm text-on-surface outline-none focus:border-primary"
        >
          <option value="">Tout statut d&apos;appel</option>
          {Object.entries(CALL_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
        <select
          value={offerStatusFilter}
          onChange={(e) => {
            setOfferStatusFilter(e.target.value as OfferStatus | '')
            setPage(1)
          }}
          className="h-10 rounded-element border border-outline-variant bg-transparent px-3 text-sm text-on-surface outline-none focus:border-primary"
        >
          <option value="">Tout statut d&apos;offre</option>
          {Object.entries(OFFER_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>{label}</option>
          ))}
        </select>
      </div>

      <div className="mt-2">
        <Button variant={creating ? 'ghost' : 'primary'} size="compact" onClick={() => setCreating((v) => !v)}>
          {creating ? 'Annuler' : '+ Nouveau centre'}
        </Button>
      </div>

      {creating && (
        <div className="mt-4 grid gap-3 border-t border-outline-variant pt-4">
          <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(200px,1fr))]">
            <Field
              label="Nom du centre / de l'entreprise"
              value={form.name}
              onChange={(e) => setForm({ ...form, name: e.target.value })}
              placeholder="Centre Atlas Formation"
            />
            <SelectField
              label="Catégorie"
              value={form.category}
              onChange={(e) => setForm({ ...form, category: e.target.value as Category })}
            >
              <option value="" disabled>Choisir…</option>
              {Object.entries(CATEGORY_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </SelectField>
            <Field
              label="Ville"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
            />
            <Field
              label="Téléphone"
              value={form.phone}
              onChange={(e) => setForm({ ...form, phone: e.target.value })}
            />
            <Field
              label="Email"
              type="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
            />
            <Field
              label="Adresse"
              value={form.address}
              onChange={(e) => setForm({ ...form, address: e.target.value })}
            />
            <Field
              label="Personne contactée"
              value={form.contact_person}
              onChange={(e) => setForm({ ...form, contact_person: e.target.value })}
            />
          </div>
          {create.error && <Notice>{apiErrorMessage(create.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>}
          <div>
            <Button
              size="compact"
              disabled={!form.name.trim() || !form.category || create.isPending}
              onClick={() => create.mutate()}
            >
              {create.isPending ? 'Création…' : 'Créer le centre'}
            </Button>
          </div>
        </div>
      )}

      {list.isError && <Notice>Impossible de charger les centres. Rechargez la page.</Notice>}
      {list.isSuccess && list.data.data.length === 0 && (
        <p className="helper-text mt-4">Aucun centre pour l&apos;instant.</p>
      )}

      <div className="mt-4 grid gap-3">
        {list.data?.data.map((center) => {
          const isOpen = openId === center.id

          return (
            <div key={center.id} className="rounded-element border border-outline-variant p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div className="grid gap-1">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="font-bold">{center.name}</span>
                    <Badge tone="neutral">{CATEGORY_LABELS[center.category]}</Badge>
                    <Badge tone={CALL_STATUS_TONE[center.call_status]}>{CALL_STATUS_LABELS[center.call_status]}</Badge>
                    <Badge tone={OFFER_STATUS_TONE[center.offer_status]}>{OFFER_STATUS_LABELS[center.offer_status]}</Badge>
                  </div>
                  <span className="helper-text">
                    {[center.city, center.phone].filter(Boolean).join(' · ') || 'Aucune coordonnée renseignée'}
                    {' · '}
                    {center.notes_count} {center.notes_count === 1 ? 'note' : 'notes'}
                  </span>
                  {center.last_note && (
                    <span className="mt-1 text-[13px] text-on-surface-variant">
                      Dernière note ({fmt(center.last_note.created_at)}) : {center.last_note.body}
                    </span>
                  )}
                </div>
                <Button variant={isOpen ? 'ghost' : 'primary'} size="compact" onClick={() => toggleOpen(center.id)}>
                  {isOpen ? 'Fermer' : 'Ouvrir'}
                </Button>
              </div>

              {isOpen && (
                <div className="mt-4 grid gap-4 border-t border-outline-variant pt-4">
                  {(center.email || center.contact_person || center.address) && (
                    <p className="helper-text">
                      {[center.contact_person, center.email, center.address].filter(Boolean).join(' · ')}
                    </p>
                  )}

                  <div className="grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(220px,1fr))]">
                    <div className="grid gap-1.5">
                      <Eyebrow>Statut d&apos;appel</Eyebrow>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(CALL_STATUS_LABELS) as CallStatus[]).map((value) => (
                          <Button
                            key={value}
                            variant={center.call_status === value ? 'primary' : 'ghost'}
                            size="compact"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: center.id, data: { call_status: value } })}
                          >
                            {CALL_STATUS_LABELS[value]}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="grid gap-1.5">
                      <Eyebrow>Statut de l&apos;offre</Eyebrow>
                      <div className="flex flex-wrap gap-1.5">
                        {(Object.keys(OFFER_STATUS_LABELS) as OfferStatus[]).map((value) => (
                          <Button
                            key={value}
                            variant={center.offer_status === value ? 'primary' : 'ghost'}
                            size="compact"
                            disabled={updateStatus.isPending}
                            onClick={() => updateStatus.mutate({ id: center.id, data: { offer_status: value } })}
                          >
                            {OFFER_STATUS_LABELS[value]}
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                  {updateStatus.error && (
                    <Notice>{apiErrorMessage(updateStatus.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
                  )}

                  {detail.isLoading && <p className="helper-text">Chargement des notes…</p>}
                  {detail.data && (
                    <div className="grid gap-2">
                      {detail.data.notes.length === 0 && (
                        <p className="helper-text">Aucune note pour l&apos;instant.</p>
                      )}
                      {detail.data.notes.map((note) => (
                        <div key={note.id} className="rounded-element bg-surface-container px-3 py-2">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <Eyebrow>{note.author ?? 'Inconnu'}</Eyebrow>
                            <span className="helper-text">{fmt(note.created_at)}</span>
                          </div>
                          <p className="mt-1 whitespace-pre-wrap text-sm text-on-surface">{note.body}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  <TextareaField
                    label="Ajouter une note"
                    hint="Visible par tous les commerciaux et l'administration"
                    value={noteDraft}
                    onChange={(e) => setNoteDraft(e.target.value)}
                    placeholder="Ex. Appelé le 12/09, intéressés, à relancer début octobre."
                    rows={3}
                  />
                  {addNote.error && (
                    <Notice>{apiErrorMessage(addNote.error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>
                  )}
                  <div>
                    <Button
                      size="compact"
                      disabled={!noteDraft.trim() || addNote.isPending}
                      onClick={() => addNote.mutate({ id: center.id, body: noteDraft.trim() })}
                    >
                      {addNote.isPending ? 'Enregistrement…' : 'Ajouter la note'}
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )
        })}
      </div>

      <div className="mt-4">
        <Pagination page={page} data={list.data} onPage={setPage} noun="centre" language="fr" />
      </div>
    </Card>
  )
}
