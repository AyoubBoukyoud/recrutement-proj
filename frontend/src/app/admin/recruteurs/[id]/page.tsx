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
 * Fiche recruteur — même transformation que `admin/candidats/[id]` :
 * `GET/PATCH /admin/recruiters/{id}*` existe et est testé, sans page qui
 * l'appelait (docs/WEBSITE_FULL_FUNCTIONALITY_AUDIT_2026-09-05.md). La
 * « vérification » est un jugement sur l'entreprise, distinct du statut du
 * compte — deux actions séparées côté API, donc deux boutons séparés ici.
 */
type ShortlistEntry = {
  id: number;
  stage: 'saved' | 'contacted' | 'interviewing' | 'placed' | 'rejected';
  notes: string | null;
  contact_revealed_at: string | null;
  candidate_profile: { id: number; first_name: string | null; last_name: string | null; profession: string | null; city: string | null };
};

type RecruiterDetail = {
  id: number;
  name: string | null;
  phone: string;
  email: string | null;
  status: 'active' | 'inactive' | 'blocked';
  status_reason: string | null;
  created_at: string;
  company: {
    company_name: string | null;
    sector: string | null;
    city: string | null;
    phone: string | null;
    website: string | null;
    employees_count: number | null;
    verified_at: string | null;
    verified_by: { name: string | null; phone: string } | null;
  } | null;
  shortlist: ShortlistEntry[];
};

type ActivityEvent = { at: string; type: string; label: string };

const STAGE_LABEL: Record<ShortlistEntry['stage'], string> = {
  saved: 'Sauvegardé',
  contacted: 'Contacté',
  interviewing: 'Entretien',
  placed: 'Placé',
  rejected: 'Rejeté',
};

const STAGE_CLASS: Record<ShortlistEntry['stage'], string> = {
  saved: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  contacted: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
  interviewing: 'bg-amud-secondary-container text-amud-on-surface',
  placed: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  rejected: 'bg-amud-error-container text-amud-on-error-container',
};

const ACCOUNT_STATUS_LABEL: Record<RecruiterDetail['status'], string> = {
  active: 'Actif',
  inactive: 'Inactif',
  blocked: 'Bloqué',
};

const TABS = [
  { id: 'apercu', label: "Vue d'ensemble" },
  { id: 'pipeline', label: 'Pipeline' },
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

export default function AdminRecruteurDetailPage() {
  const notify = useToast();
  const router = useRouter();
  const qc = useQueryClient();
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [tab, setTab] = useState('apercu');
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [editOpen, setEditOpen] = useState(false);

  const detail = useQuery({
    queryKey: ['admin-recruiter', id],
    queryFn: () => api.get(`/admin/recruiters/${id}`).then((r) => r.data as RecruiterDetail),
  });

  const activity = useQuery({
    queryKey: ['admin-recruiter-activity', id],
    queryFn: () => api.get(`/admin/recruiters/${id}/activity`).then((r) => r.data as ActivityEvent[]),
    enabled: tab === 'activite',
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-recruiter', id] });

  const verify = useMutation({
    mutationFn: (verified: boolean) => api.patch(`/admin/recruiters/${id}/verify`, { verified }),
    onSuccess: (_data, verified) => {
      notify(verified ? 'Entreprise vérifiée.' : 'Vérification retirée.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const setAccountStatus = useMutation({
    mutationFn: (status: RecruiterDetail['status']) => api.patch(`/admin/recruiters/${id}/status`, { status }),
    onSuccess: (_data, status) => {
      notify(`Statut mis à jour : ${ACCOUNT_STATUS_LABEL[status]}.`);
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  const updateCompany = useMutation({
    mutationFn: (body: { company_name?: string; sector?: string; city?: string; phone?: string; website?: string; employees_count?: number | null }) =>
      api.patch(`/admin/recruiters/${id}`, body),
    onSuccess: () => {
      setEditOpen(false);
      notify('Fiche entreprise mise à jour.');
      refresh();
    },
    onError: (error) => notify(errorMessage(error, 'Modification impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: () => api.delete(`/admin/recruiters/${id}`),
    onSuccess: () => {
      notify('Fiche entreprise supprimée.', 'info');
      router.push('/admin/recruteurs');
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  if (detail.isLoading) {
    return <p className="text-body-md text-amud-on-surface-variant">Chargement…</p>;
  }

  if (detail.isError || !detail.data) {
    return (
      <div className="mx-auto max-w-xl rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
        <span className="material-symbols-outlined mb-md text-4xl text-amud-outline">domain_disabled</span>
        <h2 className="text-title-lg text-amud-on-surface">Recruteur introuvable</h2>
        <Link href="/admin/recruteurs" className="mt-4 inline-block text-amud-primary hover:underline">
          Retour à la liste des recruteurs
        </Link>
      </div>
    );
  }

  const r = detail.data;
  const label = r.company?.company_name || r.name || r.phone;
  const placedCount = r.shortlist.filter((s) => s.stage === 'placed').length;

  return (
    <div className="mx-auto max-w-[1200px]">
      <section className="relative mb-lg overflow-hidden rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <div className="absolute bottom-0 left-0 top-0 w-2 bg-amud-primary" />
        <div className="flex flex-col items-start justify-between gap-lg md:flex-row md:items-center">
          <div className="flex items-center gap-lg">
            <div className="flex h-24 w-24 items-center justify-center rounded-full border-4 border-amud-surface bg-amud-primary-container text-title-lg font-bold text-amud-primary shadow-sm">
              {initials(label)}
            </div>
            <div>
              <div className="mb-1 flex flex-wrap items-center gap-sm">
                <h2 className="text-headline-lg text-amud-on-surface">{label}</h2>
                <span className="inline-flex items-center rounded-full bg-amud-surface-container-highest px-3 py-1 text-label-sm text-amud-on-surface-variant">
                  {ACCOUNT_STATUS_LABEL[r.status]}
                </span>
                {r.company?.verified_at ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-amud-primary-fixed px-3 py-1 text-label-sm text-amud-on-primary-fixed">
                    <span className="material-symbols-outlined text-[14px]">verified</span> Vérifiée
                  </span>
                ) : null}
              </div>
              <p className="flex items-center gap-xs text-title-lg text-amud-on-surface-variant">
                {r.company?.sector ?? 'Secteur non renseigné'}
                {r.company?.city ? (
                  <>
                    <span className="text-amud-outline-variant">•</span>
                    <span className="material-symbols-outlined text-sm">location_on</span> {r.company.city}
                  </>
                ) : null}
              </p>
              <div className="mt-sm flex flex-wrap gap-md text-label-md text-amud-on-surface-variant">
                <span className="flex items-center gap-xs">
                  <span className="material-symbols-outlined text-sm">phone</span> {r.phone}
                </span>
                {r.email ? (
                  <span className="flex items-center gap-xs">
                    <span className="material-symbols-outlined text-sm">mail</span> {r.email}
                  </span>
                ) : null}
                <span className="flex items-center gap-xs text-amud-outline">
                  <span className="material-symbols-outlined text-sm">calendar_month</span> Inscrit le {new Date(r.created_at).toLocaleDateString('fr-FR')}
                </span>
              </div>
            </div>
          </div>
          <div className="flex flex-wrap gap-sm">
            <button
              onClick={() => setEditOpen(true)}
              className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
            >
              <span className="material-symbols-outlined text-sm">edit</span> Modifier
            </button>
            <button
              onClick={() => verify.mutate(!r.company?.verified_at)}
              disabled={verify.isPending}
              className="flex items-center gap-xs rounded-lg bg-amud-primary px-md py-sm text-label-md text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              <span className="material-symbols-outlined text-sm">verified</span> {r.company?.verified_at ? 'Retirer la vérification' : 'Vérifier'}
            </button>
            {r.status !== 'blocked' ? (
              <>
                <button
                  onClick={() => setAccountStatus.mutate(r.status === 'active' ? 'inactive' : 'active')}
                  className="flex items-center gap-xs rounded-lg border border-amud-outline-variant px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
                >
                  <span className="material-symbols-outlined text-sm">block</span> {r.status === 'active' ? 'Désactiver' : 'Activer'}
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
          tabs={TABS.map((t) => (t.id === 'pipeline' ? { ...t, label: `${t.label} (${r.shortlist.length})` } : t))}
          active={tab}
          onChange={setTab}
        />
      </div>

      {tab === 'apercu' ? (
        <div className="grid grid-cols-1 gap-lg lg:grid-cols-3">
          <div className="flex flex-col gap-lg lg:col-span-2">
            <div className="grid grid-cols-2 gap-md md:grid-cols-3">
              <KpiCard icon="bookmark" value={r.shortlist.length} label="Candidats suivis" />
              <KpiCard icon="event_available" value={r.shortlist.filter((s) => s.stage === 'interviewing').length} label="En entretien" />
              <KpiCard icon="military_tech" value={placedCount} label="Placements" />
            </div>
            <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
              <h3 className="mb-md text-title-lg text-amud-on-surface">Entreprise</h3>
              <dl className="grid grid-cols-1 gap-md sm:grid-cols-2">
                <InfoRow label="Nom" value={r.company?.company_name ?? '—'} />
                <InfoRow label="Secteur" value={r.company?.sector ?? '—'} />
                <InfoRow label="Ville" value={r.company?.city ?? '—'} />
                <InfoRow label="Téléphone" value={r.company?.phone ?? '—'} />
                <InfoRow label="Site web" value={r.company?.website ?? '—'} />
                <InfoRow label="Effectif" value={r.company?.employees_count?.toString() ?? '—'} />
              </dl>
            </div>
          </div>
          <div className="flex flex-col gap-lg">
            {r.company?.verified_at && r.company.verified_by ? (
              <div className="rounded-xl border border-amud-outline-variant/30 bg-amud-surface-container-lowest p-lg">
                <h3 className="mb-md text-title-lg text-amud-on-surface">Vérification</h3>
                <p className="text-body-md text-amud-on-surface-variant">
                  Vérifiée par {r.company.verified_by.name ?? r.company.verified_by.phone} le {new Date(r.company.verified_at).toLocaleDateString('fr-FR')}
                </p>
              </div>
            ) : null}
          </div>
        </div>
      ) : null}

      {tab === 'pipeline' ? (
        <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
          <table className="w-full min-w-[560px] border-collapse text-left">
            <thead>
              <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Candidat</th>
                <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Étape</th>
                <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Notes</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-amud-outline-variant">
              {r.shortlist.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                    Aucun candidat dans le pipeline.
                  </td>
                </tr>
              ) : null}
              {r.shortlist.map((s) => {
                const cName = `${s.candidate_profile.first_name ?? ''} ${s.candidate_profile.last_name ?? ''}`.trim() || `Candidat #${s.candidate_profile.id}`;
                return (
                  <tr key={s.id}>
                    <td className="px-6 py-4">
                      <Link href={`/admin/candidats/${s.candidate_profile.id}`} className="font-semibold text-amud-on-surface hover:text-amud-primary">
                        {cName}
                      </Link>
                      <p className="text-label-sm text-amud-on-surface-variant">{s.candidate_profile.profession ?? '—'}</p>
                    </td>
                    <td className="px-6 py-4">
                      <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STAGE_CLASS[s.stage]}`}>{STAGE_LABEL[s.stage]}</span>
                    </td>
                    <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">{s.notes ?? '—'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
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

      <Modal open={editOpen} onClose={() => setEditOpen(false)} title="Modifier la fiche entreprise">
        <EditCompanyForm
          company={r.company}
          pending={updateCompany.isPending}
          onSubmit={(body) => updateCompany.mutate(body)}
          onCancel={() => setEditOpen(false)}
        />
      </Modal>

      <ConfirmDialog
        open={confirmDeleteOpen}
        onClose={() => setConfirmDeleteOpen(false)}
        onConfirm={() => remove.mutate()}
        title="Supprimer cette fiche entreprise ?"
        description="La fiche entreprise sera retirée. Le compte de connexion et sa shortlist restent en place."
        confirmLabel="Supprimer"
      />
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <dt className="text-label-sm text-amud-on-surface-variant">{label}</dt>
      <dd className="text-body-md text-amud-on-surface">{value}</dd>
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

function EditCompanyForm({
  company,
  pending,
  onSubmit,
  onCancel,
}: {
  company: RecruiterDetail['company'];
  pending: boolean;
  onSubmit: (body: { company_name?: string; sector?: string; city?: string; phone?: string; website?: string; employees_count?: number | null }) => void;
  onCancel: () => void;
}) {
  const [companyName, setCompanyName] = useState(company?.company_name ?? '');
  const [sector, setSector] = useState(company?.sector ?? '');
  const [city, setCity] = useState(company?.city ?? '');
  const [phone, setPhone] = useState(company?.phone ?? '');
  const [website, setWebsite] = useState(company?.website ?? '');
  const [employeesCount, setEmployeesCount] = useState(company?.employees_count?.toString() ?? '');

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        onSubmit({
          company_name: companyName.trim() || undefined,
          sector: sector.trim() || undefined,
          city: city.trim() || undefined,
          phone: phone.trim() || undefined,
          website: website.trim() || undefined,
          employees_count: employeesCount ? Number(employeesCount) : null,
        });
      }}
      className="grid grid-cols-1 gap-md sm:grid-cols-2"
    >
      <div className="sm:col-span-2">
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Nom de l’entreprise</label>
        <input autoFocus value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Secteur</label>
        <input value={sector} onChange={(e) => setSector(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Ville</label>
        <input value={city} onChange={(e) => setCity(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Téléphone</label>
        <input value={phone} onChange={(e) => setPhone(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Site web</label>
        <input value={website} onChange={(e) => setWebsite(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div>
        <label className="mb-1 block text-label-md text-amud-on-surface-variant">Effectif</label>
        <input type="number" min={0} value={employeesCount} onChange={(e) => setEmployeesCount(e.target.value)} className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary" />
      </div>
      <div className="flex justify-end gap-sm sm:col-span-2">
        <button type="button" onClick={onCancel} className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
          Annuler
        </button>
        <button type="submit" disabled={pending} className="rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white hover:bg-amud-primary-dark disabled:opacity-50">
          {pending ? 'Enregistrement…' : 'Enregistrer'}
        </button>
      </div>
    </form>
  );
}
