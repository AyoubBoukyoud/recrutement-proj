'use client';

import { useMemo, useState } from 'react';
import { Modal } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { useCollection } from '@/lib/amud/storage/useCollection';
import { applicationsCollection } from '@/lib/amud/localApplications';
import { applicationsSeed, type Application } from '@/data/amud/applications';
import { offresCollection } from '@/lib/amud/localOffres';
import { offresSeed } from '@/data/amud/offres';
import { candidatesCollection } from '@/lib/amud/localCandidates';
import { candidatesSeed } from '@/data/amud/candidates';
import { recruitersCollection } from '@/lib/amud/localRecruiters';
import { recruitersSeed } from '@/data/amud/recruiters';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { scheduleInterview } from '@/lib/amud/interviewCascades';
import { generateId } from '@/lib/amud/storage/ids';
import type { InterviewType } from '@/data/amud/interviews';

const TYPES: InterviewType[] = ['Visioconférence', 'Téléphonique', 'Présentiel'];

export function ScheduleInterviewModal({
  open,
  onClose,
  application,
  candidateId,
  onScheduled,
}: {
  open: boolean;
  onClose: () => void;
  /** Pré-remplissage direct si on part d'une candidature connue (liste/détail candidatures, kanban d'offre). */
  application?: Application;
  /** Pré-remplissage si on part d'une fiche candidat (l’offre reste à choisir). */
  candidateId?: string;
  onScheduled?: () => void;
}) {
  const notify = useToast();
  const [applications, { add: addApplication }] = useCollection(applicationsCollection, applicationsSeed);
  const [offres] = useCollection(offresCollection, offresSeed);
  const [candidates] = useCollection(candidatesCollection, candidatesSeed);
  const [recruiters] = useCollection(recruitersCollection, recruitersSeed);

  const myOffres = useMemo(() => offres.filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [offres]);
  const myRecruiters = useMemo(() => recruiters.filter((r) => r.entrepriseId === CURRENT_EMPLOYER.entrepriseId), [recruiters]);

  const [selectedOfferId, setSelectedOfferId] = useState(application?.offerId ?? '');
  const [recruiterId, setRecruiterId] = useState<string>(CURRENT_EMPLOYER.userId);
  const [date, setDate] = useState('');
  const [heureDebut, setHeureDebut] = useState('10:00');
  const [heureFin, setHeureFin] = useState('10:45');
  const [type, setType] = useState<InterviewType>('Visioconférence');
  const [lieuOuLien, setLieuOuLien] = useState('');
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const candidate = candidateId ? candidates.find((c) => c.id === candidateId) : undefined;
  const candidateNom = application?.candidateNom ?? candidate?.nom ?? '';

  function reset() {
    setSelectedOfferId(application?.offerId ?? '');
    setRecruiterId(CURRENT_EMPLOYER.userId);
    setDate('');
    setHeureDebut('10:00');
    setHeureFin('10:45');
    setType('Visioconférence');
    setLieuOuLien('');
    setNotes('');
  }

  function handleClose() {
    reset();
    onClose();
  }

  function resolveApplication(): Application | null {
    if (application) return application;
    const offre = myOffres.find((o) => o.id === selectedOfferId);
    if (!candidateId || !offre) return null;
    const existing = applications.find((a) => a.candidateId === candidateId && a.offerId === offre.id && a.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    if (existing) return existing;
    const now = new Date().toISOString();
    const created: Application = {
      id: generateId('application'),
      candidateId,
      candidateNom: candidate?.nom ?? '',
      offerId: offre.id,
      offerTitre: offre.titre,
      entrepriseId: CURRENT_EMPLOYER.entrepriseId,
      entrepriseNom: CURRENT_EMPLOYER.entrepriseNom,
      recruiterId: CURRENT_EMPLOYER.userId,
      recruiterNom: CURRENT_EMPLOYER.userNom,
      tags: candidate?.competences.slice(0, 3) ?? [],
      score: candidate?.score ?? 0,
      createdAt: now,
      updatedAt: now,
      status: 'NEW',
    };
    addApplication(created);
    return created;
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!date || !heureDebut || !heureFin) return;
    setSubmitting(true);
    const app = resolveApplication();
    if (!app) {
      notify('Sélectionnez une offre pour planifier l’entretien.', 'error');
      setSubmitting(false);
      return;
    }
    const recruiter = myRecruiters.find((r) => r.id === recruiterId);
    scheduleInterview(app, {
      recruiterId: recruiter?.id ?? CURRENT_EMPLOYER.userId,
      recruiterNom: recruiter?.nom ?? CURRENT_EMPLOYER.userNom,
      date,
      heureDebut,
      heureFin,
      type,
      lieuOuLien: lieuOuLien.trim() || undefined,
      notes: notes.trim() || undefined,
    });
    notify(`Entretien planifié avec ${app.candidateNom}.`);
    setSubmitting(false);
    reset();
    onClose();
    onScheduled?.();
  }

  return (
    <Modal open={open} onClose={handleClose} title="Planifier un entretien" subtitle={candidateNom || undefined}>
      <form id="schedule-interview-form" onSubmit={handleSubmit} className="flex flex-col gap-md">
        {!application ? (
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Offre concernée *</label>
            <select value={selectedOfferId} onChange={(e) => setSelectedOfferId(e.target.value)} required className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
              <option value="">Sélectionner une offre</option>
              {myOffres.map((o) => (
                <option key={o.id} value={o.id}>
                  {o.titre}
                </option>
              ))}
            </select>
          </div>
        ) : null}
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Recruteur</label>
          <select value={recruiterId} onChange={(e) => setRecruiterId(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
            <option value={CURRENT_EMPLOYER.userId}>{CURRENT_EMPLOYER.userNom} (vous)</option>
            {myRecruiters.filter((r) => r.id !== CURRENT_EMPLOYER.userId).map((r) => (
              <option key={r.id} value={r.id}>
                {r.nom}
              </option>
            ))}
          </select>
        </div>
        <div className="grid grid-cols-1 gap-md sm:grid-cols-3">
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Date *</label>
            <input value={date} onChange={(e) => setDate(e.target.value)} required type="date" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Début *</label>
            <input value={heureDebut} onChange={(e) => setHeureDebut(e.target.value)} required type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
          <div>
            <label className="mb-1 block text-label-md text-amud-on-surface-variant">Fin *</label>
            <input value={heureFin} onChange={(e) => setHeureFin(e.target.value)} required type="time" className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Type d’entretien</label>
          <div className="flex flex-wrap gap-sm">
            {TYPES.map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setType(t)}
                className={`rounded-full px-md py-1.5 text-label-sm font-medium transition-colors ${type === t ? 'bg-amud-primary text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant'}`}
              >
                {t}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">{type === 'Présentiel' ? 'Lieu' : 'Lien de visio / numéro'}</label>
          <input value={lieuOuLien} onChange={(e) => setLieuOuLien(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" type="text" />
        </div>
        <div>
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Notes</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={3} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
        </div>
      </form>
      <div className="mt-lg flex justify-end gap-sm">
        <button type="button" onClick={handleClose} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
          Annuler
        </button>
        <button type="submit" form="schedule-interview-form" disabled={submitting} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm hover:brightness-110 disabled:opacity-60">
          Planifier
        </button>
      </div>
    </Modal>
  );
}
