'use client';

import { useEffect, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/opsApi'
import { apiErrorMessage } from '@/lib/apiError'
import { Badge, Button, Eyebrow, Notice, SelectField } from '@/components/ui'
import type { CandidateContact, CandidateDetail, ShortlistEntry, ShortlistStage } from '@/types/candidate'

const STAGES: { value: ShortlistStage; label: string }[] = [
  { value: 'saved', label: 'Enregistré' },
  { value: 'contacted', label: 'Contacté' },
  { value: 'interviewing', label: 'En entretien' },
  { value: 'placed', label: 'Placé' },
  { value: 'rejected', label: 'Sans suite' },
]

/**
 * L'étape suivante, qui manquait entièrement au dossier.
 *
 * Les coordonnées sont une action, pas un champ : la plateforme recueille un
 * consentement CNDP explicite, donc prendre le numéro de quelqu'un est
 * enregistré au nom du recruteur qui l'a pris. L'enregistrement, l'étape et
 * les notes l'accompagnent, parce que le moment où l'on obtient le numéro est
 * celui où le candidat entre dans un pipeline.
 */
export function ShortlistPanel({ candidate }: { candidate: CandidateDetail }) {
  const queryClient = useQueryClient()
  const entry = candidate.shortlist

  const [notes, setNotes] = useState(entry?.notes ?? '')
  const [savedNotes, setSavedNotes] = useState(entry?.notes ?? '')

  // Un autre candidat ouvert dans le même panneau repart de ses notes à lui,
  // pas de celles du précédent.
  useEffect(() => {
    setNotes(entry?.notes ?? '')
    setSavedNotes(entry?.notes ?? '')
  }, [candidate.id])

  const invalidate = () =>
    Promise.all([
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidate', candidate.id] }),
      queryClient.invalidateQueries({ queryKey: ['recruiter-candidates'] }),
      queryClient.invalidateQueries({ queryKey: ['recruiter-shortlist'] }),
    ])

  const save = useMutation({
    mutationFn: (payload: { stage?: ShortlistStage; notes?: string }) =>
      api
        .put(`/recruiter/candidates/${candidate.id}/shortlist`, payload)
        .then((r) => r.data as ShortlistEntry & { notes: string | null }),
    onSuccess: async (data) => {
      setSavedNotes(data.notes ?? '')
      await invalidate()
    },
  })

  const remove = useMutation({
    mutationFn: () => api.delete(`/recruiter/candidates/${candidate.id}/shortlist`),
    onSuccess: async () => {
      setNotes('')
      setSavedNotes('')
      await invalidate()
    },
  })

  const reveal = useMutation({
    mutationFn: () =>
      api
        .post(`/recruiter/candidates/${candidate.id}/contact`)
        .then((r) => r.data as { contact: CandidateContact }),
    onSuccess: invalidate,
  })

  const contact = candidate.contact ?? reveal.data?.contact ?? null
  const failure = save.error ?? remove.error ?? reveal.error
  const notesDirty = notes !== savedNotes

  return (
    <div className="grid gap-4 rounded-element border border-outline-variant bg-primary/[0.04] p-4">
      <div className="flex flex-wrap items-center gap-2">
        <Eyebrow tone="accent">Votre pipeline</Eyebrow>
        {entry ? <Badge tone="done">dans votre sélection</Badge> : <Badge>non enregistré</Badge>}
      </div>

      {contact ? (
        <div className="grid gap-1">
          <Eyebrow>Coordonnées</Eyebrow>
          <a href={`tel:${contact.phone}`} className="font-mono text-base text-primary hover:underline">
            {contact.phone}
          </a>
          {contact.email && (
            <a href={`mailto:${contact.email}`} className="text-sm text-primary hover:underline">
              {contact.email}
            </a>
          )}
          {candidate.shortlist?.contact_revealed_at && (
            <span className="helper-text">
              Communiquées le {new Date(candidate.shortlist.contact_revealed_at).toLocaleDateString('fr-FR')}
            </span>
          )}
        </div>
      ) : (
        <div className="grid justify-items-start gap-2">
          <Button onClick={() => reveal.mutate()} disabled={reveal.isPending}>
            {reveal.isPending ? 'Ouverture…' : 'Afficher les coordonnées'}
          </Button>
          <span className="helper-text">
            Ce candidat a consenti à être contacté au sujet de postes. La divulgation est enregistrée au nom de
            votre compte et l&apos;ajoute à votre sélection.
          </span>
        </div>
      )}

      <div className="grid max-w-xs gap-2">
        <SelectField
          label="Étape"
          value={entry?.stage ?? 'saved'}
          onChange={(e) => save.mutate({ stage: e.target.value as ShortlistStage })}
          disabled={save.isPending}
        >
          {STAGES.map((stage) => (
            <option key={stage.value} value={stage.value}>
              {stage.label}
            </option>
          ))}
        </SelectField>
      </div>

      <label className="grid gap-1.5">
        <span className="text-[13px] font-medium text-on-surface-variant">Notes privées</span>
        <textarea
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
          placeholder="Vous seul les voyez."
          className="w-full resize-y rounded-element border border-outline bg-surface-lowest px-3.5 py-2.5 text-[15px] text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20"
        />
      </label>

      <div className="flex flex-wrap gap-2">
        <Button onClick={() => save.mutate({ notes })} disabled={save.isPending || !notesDirty}>
          {save.isPending ? 'Enregistrement…' : notesDirty ? 'Enregistrer les notes' : 'Notes enregistrées'}
        </Button>
        {entry && (
          <Button variant="ghost" onClick={() => remove.mutate()} disabled={remove.isPending}>
            Retirer de la sélection
          </Button>
        )}
        <Button variant="ghost" onClick={() => window.print()}>
          Imprimer le dossier
        </Button>
      </div>

      {failure && <Notice>{apiErrorMessage(failure, "L'enregistrement a échoué. Réessayez.")}</Notice>}
    </div>
  )
}
