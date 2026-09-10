'use client';

import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { ConfirmDialog, Modal, Tabs } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';

/*
 * Fiche candidat — porte le style de la maquette `/amud/admin/candidats/[id]`
 * (en-tête avec avatar/statut, onglets, cartes KPI) sur le vrai dossier
 * (`GET /admin/candidates/{id}`), avec un onglet Documents qui n'existe nulle
 * part ailleurs dans le produit : c'est la file d'approbation des pièces
 * d'identité identifiée comme la lacune n°1 de
 * docs/WEBSITE_FULL_FUNCTIONALITY_AUDIT_2026-09-05.md — le backend
 * (`PATCH /admin/documents/{id}/approval`) existe et est testé, mais aucune
 * page ne l'appelait avant celle-ci.
 */
type CandidateDocument = {
  id: number;
  type: 'cv' | 'certificate' | 'diploma' | 'identity';
  ocr_status: string;
  approval_status: 'pending' | 'approved' | 'rejected';
  rejection_reason: string | null;
  url: string | null;
  reviewed_by: { name: string | null; phone: string } | null;
  reviewed_at: string | null;
  created_at: string;
};

type Education = { id: number; level: string; field: string | null; institution: string | null };
type Language = { id: number; language: string; cefr_level: string | null; source: string | null };
type Skill = { id: number; skill: string; level: string | null };

type CandidateDetail = {
  id: number;
  first_name: string | null;
  last_name: string | null;
  profession: string | null;
  city: string | null;
  availability_status: string | null;
  submitted_at: string | null;
  verified_at: string | null;
  admin_notes: string | null;
  verified_by: { name: string | null; phone: string } | null;
  user: { name: string | null; phone: string; email: string | null; status: 'active' | 'inactive' | 'blocked'; status_reason: string | null; created_at: string };
  documents: CandidateDocument[];
  educations: Education[];
  languages: Language[];
  skills: Skill[];
  completeness: { percent: number };
  checklist: { profile_completed: boolean; cv_uploaded: boolean; certificates_uploaded: boolean; video_recorded: boolean };
  engagement: { assigned: number; completed: number; completion_rate: number | null; streak_days: number };
};

type ActivityEvent = { at: string; type: string; label: string };
type StageTask = { id: number; title: string; description: string | null; category: string; estimated_minutes: number; is_active: boolean };
type TaskAssignment = { id: number; assigned_for: string; status: 'assigned' | 'completed' | 'skipped'; task: StageTask; candidate_note: string | null; admin_feedback: string | null };

const DOCUMENT_TYPE_LABEL: Record<CandidateDocument['type'], string> = {
  cv: 'CV',
  certificate: 'Certificat',
  diploma: 'Diplôme',
  identity: "Pièce d'identité",
};

const APPROVAL_LABEL: Record<CandidateDocument['approval_status'], string> = {
  pending: 'En attente',
  approved: 'Approuvé',
  rejected: 'Rejeté',
};

const APPROVAL_CLASS: Record<CandidateDocument['approval_status'], string> = {
  pending: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  approved: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  rejected: 'bg-amud-error-container text-amud-on-error-container',
};

const ACCOUNT_STATUS_LABEL: Record<CandidateDetail['user']['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  blocked: 'Bloqué',
};

const TABS = [
  { id: 'apercu', label: "Vue d'ensemble" },
  { id: 'documents', label: 'Documents' },
  { id: 'stage', label: 'Stage quotidien' },
  { id: 'activite', label: 'Activité' },
];

function initials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

export default function AdminCandidatDetailPage() {
  const notify = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState('apercu');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [rejecting, setRejecting] = useState<CandidateDocument | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [selectedTaskIds, setSelectedTaskIds] = useState<number[]>([]);
  const [assignedFor, setAssignedFor] = useState(new Date().toISOString().slice(0, 10));

  const detail = useQuery({
    queryKey: ['admin-candidate', id],
    queryFn: () => api.get(`/admin/candidates/${id}`).then((r) => r.data as CandidateDetail),
  });

  const activity = useQuery({
    queryKey: ['admin-candidate-activity', id],
    queryFn: () => api.get(`/admin/candidates/${id}/activity`).then((r) => r.data as ActivityEvent[]),
    enabled: tab === 'activite',
  });

  const stageTasks = useQuery({
    queryKey: ['admin-tasks-active'],
    queryFn: () => api.get('/admin/tasks').then((r) => r.data as { data: StageTask[] }),
    enabled: tab === 'stage',
  });

  const assignments = useQuery({
    queryKey: ['admin-candidate-assignments', id],
    queryFn: () => api.get(`/admin/candidates/${id}/assignments`).then((r) => r.data as { data: TaskAssignment[] }),
    enabled: tab === 'stage',
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-candidate', id] });

  const reviewDocument = useMutation({
    mutationFn: ({ documentId, approval_status, rejection_reason }: { documentId: number; approval_status: 'approved' | 'rejected'; rejection_reason?: string }) =>
      api.patch(`/admin/documents/${documentId}/approval`, { approval_status, rejection_reason: rejection_reason ?? null }),
    onSuccess: (_data, variables) => {
      setRejecting(null);
      setRejectionReason('');
      notify(variables.approval_status === 'approved' ? 'Document approuvé.' : 'Document rejeté.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const verify = useMutation({
    mutationFn: (verified: boolean) => api.patch(`/admin/candidates/${id}`, { verified }),
    onSuccess: (_data, verified) => {
      notify(verified ? 'Dossier vérifié.' : 'Vérification retirée.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const setAccountStatus = useMutation({
    mutationFn: (status: CandidateDetail['user']['status']) => api.patch(`/admin/candidates/${id}/status`, { status }),
    onSuccess: (_data, status) => {
      notify(`Statut mis à jour : ${ACCOUNT_STATUS_LABEL[status]}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/candidates/${id}`),
    onSuccess: () => {
      notify('Dossier supprimé.', 'info');
      router.push('/admin/candidats');
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  const assignTasks = useMutation({
    mutationFn: () => api.post(`/admin/candidates/${id}/assignments`, { task_ids: selectedTaskIds, assigned_for: assignedFor }),
    onSuccess: () => {
      setSelectedTaskIds([]);
      qc.invalidateQueries({ queryKey: ['admin-candidate-assignments', id] });
      qc.invalidateQueries({ queryKey: ['admin-candidate', id] });
      notify('Activités assignées au candidat.');
    },
    onError: (error) => notify(errorMessage(error, 'Assignation impossible.'), 'error'),
  });

  const removeAssignment = useMutation({
    mutationFn: (assignmentId: number) => api.delete(`/admin/assignments/${assignmentId}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['admin-candidate-assignments', id] });
      qc.invalidateQueries({ queryKey: ['admin-candidate', id] });
      notify('Assignation retirée.', 'info');
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  if (detail.isLoading) {
    return <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>;
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">person_off</span>
        <h2 className="text-title-lg text-amud-on-surface">Candidat introuvable</h2>
        <Link href="/admin/candidats" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des candidats
        </Link>
      </div>
    );
  }

  const c = detail.data;
  const name = `${c.first_name ?? ''} ${c.last_name ?? ''}`.trim() || c.user.phone;
  const pendingDocs = c.documents.filter((d) => d.approval_status === 'pending').length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amud-surface bg-amud-primary-container text-title-lg font-bold text-amud-primary shadow-sm">
              {initials(name)}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-sm">
                <h2 className="text-headline-lg text-amud-on-surface">{name}</h2>
                <span className="inline-flex items-center rounded-full bg-amud-surface-container-highest px-3 py-1 text-label-sm text-amud-on-surface-variant">
                  {ACCOUNT_STATUS_LABEL[c.user.status]}
                </span>
                {c.verified_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amud-primary-fixed px-3 py-1 text-label-sm text-amud-on-primary-fixed">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Vérifié
                  </span>
                ) : null}
              </div>
              <p className="flex items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {c.profession ?? 'Profession non renseignée'}
                {c.city ? (
                  <>
                    <span className="text-amud-outline-variant">•</span>
                    <span className="material-symbols-outlined text-sm">location_on</span> {c.city}
                  </>
                ) : null}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">phone</span> {c.user.phone}
                </span>
                {c.user.email ? (
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">mail</span> {c.user.email}
                  </span>
                ) : null}
                <span className="flex items-center gap-xs text-amud-outline">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Inscrit le {new Date(c.user.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button
              onClick={() => verify.mutate(!c.verified_at)}
              disabled={verify.isPending}
              className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">verified</span> {c.verified_at ? 'Retirer la vérification' : 'Vérifier le dossier'}
            </button>
            {c.user.status !== 'blocked' ? (
              <>
                <button
                  onClick={() => setAccountStatus.mutate(c.user.status === 'active' ? 'inactive' : 'active')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-sm">block</span> {c.user.status === 'active' ? 'Désactiver' : 'Activer'}
                </button>
                <button
                  onClick={() => setAccountStatus.mutate('blocked')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-error transition-colors hover:bg-amud-error-container"
                >
                  <span className="material-symbols-outlined text-sm">gpp_maybe</span> Bloquer
                </button>
              </>
            ) : (
              <button
                onClick={() => setAccountStatus.mutate('active')}
                className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
              >
                <span className="material-symbols-outlined text-sm">lock_open</span> Débloquer
              </button>
            )}
            <button
              onClick={() => setConfirmDeleteOpen(true)}
              className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-sm text-amud-error transition-colors hover:bg-amud-error-container"
            >
              <span className="material-symbols-outlined">delete</span>
            </button>
          </div>
        </div>
      </section>

      <div className="mb-lg">
        <Tabs
          tabs={TABS.map((t) => (t.id === 'documents' && pendingDocs > 0 ? { ...t, label: `${t.label} (${pendingDocs})` } : t))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'apercu' ? (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-4">
              <KpiCard icon="task_alt" value={`${c.completeness.percent}%`} label="Profil complet" />
              <KpiCard icon="school" value={c.educations.length} label="Formations" />
              <KpiCard icon="translate" value={c.languages.length} label="Langues" />
              <KpiCard icon="local_fire_department" value={c.engagement.streak_days} label="Jours de suite" />
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Compétences</h3>
              {c.skills.length > 0 ? (
                <div className="flex flex-wrap gap-2">
                  {c.skills.map((s) => (
                    <span key={s.id} className="rounded-full bg-amud-surface-container-high px-3 py-1 text-label-sm text-amud-on-surface-variant">
                      {s.skill}
                    </span>
                  ))}
                </div>
              ) : (
                <p className="text-body-md text-amud-on-surface-variant">Aucune compétence renseignée.</p>
              )}
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Formations</h3>
              {c.educations.length > 0 ? (
                <ul className="flex flex-col gap-sm">
                  {c.educations.map((e) => (
                    <li key={e.id} className="text-body-md text-amud-on-surface">
                      {e.level}
                      {e.field ? ` · ${e.field}` : ''}
                      {e.institution ? <span className="text-amud-on-surface-variant"> — {e.institution}</span> : null}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-md text-amud-on-surface-variant">Aucune formation renseignée.</p>
              )}
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Langues</h3>
              {c.languages.length > 0 ? (
                <ul className="flex flex-col gap-sm">
                  {c.languages.map((l) => (
                    <li key={l.id} className="flex items-center justify-between text-body-md text-amud-on-surface">
                      <span>{l.language}</span>
                      <span className="text-amud-on-surface-variant">{l.cefr_level ?? 'Non évalué'}</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-body-md text-amud-on-surface-variant">Aucune langue renseignée.</p>
              )}
            </div>
          </div>
          <div className="flex flex-col gap-lg">
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Checklist</h3>
              <ul className="flex flex-col gap-sm text-body-md">
                {[
                  ['Profil complété', c.checklist.profile_completed],
                  ['CV téléversé', c.checklist.cv_uploaded],
                  ['Certificats téléversés', c.checklist.certificates_uploaded],
                  ['Vidéo enregistrée', c.checklist.video_recorded],
                ].map(([label, done]) => (
                  <li key={label as string} className="flex items-center gap-sm">
                    <span className={`material-symbols-outlined text-[18px] ${done ? 'text-amud-primary' : 'text-amud-outline'}`}>
                      {done ? 'check_circle' : 'radio_button_unchecked'}
                    </span>
                    <span className={done ? 'text-amud-on-surface' : 'text-amud-on-surface-variant'}>{label}</span>
                  </li>
                ))}
              </ul>
            </div>
            {c.admin_notes ? (
              <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
                <h3 className="mb-md text-title-lg text-amud-on-surface">Notes internes</h3>
                <p className="whitespace-pre-wrap text-body-md text-amud-on-surface-variant">{c.admin_notes}</p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'documents' ? (
        <div className="flex flex-col gap-md">
          {c.documents.length === 0 ? (
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-xl text-center text-body-md text-amud-on-surface-variant">
              Aucun document téléversé pour l’instant.
            </div>
          ) : (
            c.documents.map((doc) => (
              <div key={doc.id} className="flex flex-col gap-sm rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-center gap-md">
                  <span className="material-symbols-outlined text-3xl text-amud-primary">description</span>
                  <div>
                    <p className="text-title-md font-semibold text-amud-on-surface">{DOCUMENT_TYPE_LABEL[doc.type]}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">
                      Téléversé le {new Date(doc.created_at).toLocaleDateString('fr-FR')} · OCR : {doc.ocr_status}
                    </p>
                    {doc.approval_status === 'rejected' && doc.rejection_reason ? (
                      <p className="mt-1 text-label-sm text-amud-error">Motif : {doc.rejection_reason}</p>
                    ) : null}
                    {doc.reviewed_by ? (
                      <p className="mt-1 text-label-sm text-amud-on-surface-variant">
                        Revu par {doc.reviewed_by.name ?? doc.reviewed_by.phone}
                        {doc.reviewed_at ? ` le ${new Date(doc.reviewed_at).toLocaleDateString('fr-FR')}` : ''}
                      </p>
                    ) : null}
                  </div>
                </div>
                <div className="flex items-center gap-sm">
                  <span className={`inline-flex items-center rounded-full px-3 py-1 text-label-sm font-medium ${APPROVAL_CLASS[doc.approval_status]}`}>
                    {APPROVAL_LABEL[doc.approval_status]}
                  </span>
                  {doc.url ? (
                    <a href={doc.url} target="_blank" rel="noreferrer" className="flex items-center justify-center rounded-lg border border-amud-outline-variant p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low">
                      <span className="material-symbols-outlined text-[20px]">visibility</span>
                    </a>
                  ) : null}
                  {doc.approval_status !== 'approved' ? (
                    <button
                      onClick={() => reviewDocument.mutate({ documentId: doc.id, approval_status: 'approved' })}
                      disabled={reviewDocument.isPending}
                      className="flex items-center gap-xs rounded-lg bg-amud-primary px-3 py-2 text-label-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    >
                      <span className="material-symbols-outlined text-[18px]">check_circle</span> Approuver
                    </button>
                  ) : null}
                  {doc.approval_status !== 'rejected' ? (
                    <button
                      onClick={() => setRejecting(doc)}
                      className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-error transition-colors hover:bg-amud-error-container"
                    >
                      <span className="material-symbols-outlined text-[18px]">cancel</span> Rejeter
                    </button>
                  ) : null}
                </div>
              </div>
            ))
          )}
        </div>
      ) : null}

      {tab === 'activite' ? (
        <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
          {activity.isLoading ? (
            <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>
          ) : (activity.data ?? []).length === 0 ? (
            <p className="text-body-md text-amud-on-surface-variant">Aucun évènement pour l’instant.</p>
          ) : (
            <ol className="flex flex-col gap-md">
              {(activity.data ?? []).map((event, i) => (
                <li key={i} className="flex items-start gap-sm border-l-2 border-amud-outline-variant pl-md">
                  <div>
                    <p className="text-body-md text-amud-on-surface">{event.label}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{new Date(event.at).toLocaleString('fr-FR')}</p>
                  </div>
                </li>
              ))}
            </ol>
          )}
        </div>
      ) : null}

      {tab === 'stage' ? (
        <div className="grid gap-lg lg:grid-cols-[1fr_1fr]">
          <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
            <div className="mb-md flex flex-wrap items-end justify-between gap-3">
              <div><h3 className="text-title-lg text-amud-on-surface">Assigner des activités</h3><p className="mt-1 text-label-sm text-amud-on-surface-variant">Les tâches apparaîtront immédiatement dans « Tâches » chez le candidat.</p></div>
              <label className="grid gap-1"><span className="text-label-sm text-amud-on-surface-variant">Pour le</span><input type="date" value={assignedFor} onChange={(event) => setAssignedFor(event.target.value)} className="rounded-lg border border-amud-outline-variant bg-amud-surface px-2 py-1.5 text-label-sm text-amud-on-surface" /></label>
            </div>
            {stageTasks.isLoading ? <p className="text-body-md text-amud-on-surface-variant">Chargement…</p> : <div className="grid gap-2">{(stageTasks.data?.data ?? []).map((task) => <label key={task.id} className="flex cursor-pointer items-start gap-3 rounded-lg border border-amud-outline-variant p-3 hover:bg-amud-surface-container-low"><input type="checkbox" checked={selectedTaskIds.includes(task.id)} onChange={(event) => setSelectedTaskIds((current) => event.target.checked ? [...current, task.id] : current.filter((idValue) => idValue !== task.id))} className="mt-1 h-4 w-4 accent-[var(--amud-primary)]" /><span className="min-w-0"><span className="block text-label-md font-semibold text-amud-on-surface">{task.title}</span><span className="mt-0.5 block text-label-sm text-amud-on-surface-variant">{task.estimated_minutes} min · {task.category}</span></span></label>)}</div>}
            <button type="button" onClick={() => assignTasks.mutate()} disabled={assignTasks.isPending || selectedTaskIds.length === 0} className="mt-md rounded-lg bg-amud-primary px-md py-sm text-label-md font-semibold text-white disabled:opacity-50">{assignTasks.isPending ? 'Assignation…' : `Assigner ${selectedTaskIds.length || ''} activité${selectedTaskIds.length > 1 ? 's' : ''}`}</button>
          </div>
          <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
            <h3 className="mb-md text-title-lg text-amud-on-surface">Historique des assignations</h3>
            {assignments.isLoading ? <p className="text-body-md text-amud-on-surface-variant">Chargement…</p> : (assignments.data?.data ?? []).length === 0 ? <p className="text-body-md text-amud-on-surface-variant">Aucune activité assignée.</p> : <div className="grid gap-2">{(assignments.data?.data ?? []).map((assignment) => <div key={assignment.id} className="flex items-start justify-between gap-3 rounded-lg border border-amud-outline-variant p-3"><div><p className="text-label-md font-semibold text-amud-on-surface">{assignment.task.title}</p><p className="text-label-sm text-amud-on-surface-variant">{new Date(assignment.assigned_for).toLocaleDateString('fr-FR')} · {assignment.status === 'completed' ? 'Terminée' : assignment.status === 'skipped' ? 'Ignorée' : 'À faire'}</p>{assignment.admin_feedback && <p className="mt-1 text-label-sm text-amud-on-surface-variant">Note : {assignment.admin_feedback}</p>}</div>{assignment.status !== 'completed' && <button type="button" onClick={() => removeAssignment.mutate(assignment.id)} className="text-label-sm font-semibold text-amud-error hover:underline">Retirer</button>}</div>)}</div>}
          </div>
        </div>
      ) : null}

      <Modal
        open={rejecting !== null}
        onClose={() => {
          setRejecting(null);
          setRejectionReason('');
        }}
        title="Rejeter ce document"
        subtitle="Le candidat verra ce motif et devra téléverser un nouveau document."
        footer={
          <div className="flex justify-end gap-sm">
            <button
              type="button"
              onClick={() => {
                setRejecting(null);
                setRejectionReason('');
              }}
              className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              Annuler
            </button>
            <button
              type="submit"
              form="reject-document-form"
              disabled={reviewDocument.isPending}
              className="rounded-lg bg-amud-error px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:opacity-90 disabled:opacity-50"
            >
              Rejeter
            </button>
          </div>
        }
      >
        <form
          id="reject-document-form"
          onSubmit={(e) => {
            e.preventDefault();
            if (!rejecting || !rejectionReason.trim()) return;
            reviewDocument.mutate({ documentId: rejecting.id, approval_status: 'rejected', rejection_reason: rejectionReason.trim() });
          }}
        >
          <label className="mb-1 block text-label-md text-amud-on-surface-variant">Motif du rejet</label>
          <textarea
            autoFocus
            required
            value={rejectionReason}
            onChange={(e) => setRejectionReason(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Photo illisible, document expiré, mauvais type de pièce…"
          />
        </form>
      </Modal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Supprimer ce dossier ?"
        description="Documents, formations, langues et candidatures liées seront retirés. Le compte de connexion reste actif."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function KpiCard({ icon, value, label }: { icon: string; value: string | number; label: string }) {
  return (
    <div className="flex flex-col justify-between rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-md">
      <span className="material-symbols-outlined mb-sm text-amud-primary">{icon}</span>
      <div>
        <div className="text-title-lg text-amud-on-surface">{value}</div>
        <div className="text-label-sm text-amud-on-surface-variant">{label}</div>
      </div>
    </div>
  );
}
