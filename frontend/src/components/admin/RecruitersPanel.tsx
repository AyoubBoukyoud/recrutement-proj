'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/navigation';
import { RotateCcw, SlidersHorizontal } from 'lucide-react';
import { api } from '@/lib/opsApi';
import {
  Avatar,
  Badge,
  BulkActionBar,
  Button,
  Card,
  Checkbox,
  DropdownMenu,
  Eyebrow,
  Field,
  Modal,
  Notice,
  SectionHeader,
  SelectField,
} from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { apiErrorMessage } from '@/lib/apiError';
import { ACCOUNT_STATUS_LABELS, type AccountStatus, type AdminRecruiterRow } from '@/types/admin';
import type { PaginatedResponse } from '@/types/candidate';

const ACCOUNT_STATUS_TONE: Record<AccountStatus, 'done' | 'pending' | 'error'> = {
  active: 'done',
  inactive: 'pending',
  blocked: 'error',
};

type Metrics = {
  recruiters: {
    total: number;
    active: number;
    pending_verification: number;
    verified: number;
    blocked: number;
    shortlisted_candidates: number;
    interviews_scheduled: number;
  };
};

type Filters = {
  city: string;
  sector: string;
  account_status: string;
  verified: string;
  date_from: string;
  date_to: string;
};

const EMPTY_FILTERS: Filters = { city: '', sector: '', account_status: '', verified: '', date_from: '', date_to: '' };

function RecruiterKpis() {
  const { data } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  if (!data) return null;

  const items: [string, number][] = [
    ['Total recruteurs', data.recruiters.total],
    ['Recruteurs actifs', data.recruiters.active],
    ['En attente de vérification', data.recruiters.pending_verification],
    ['Recruteurs vérifiés', data.recruiters.verified],
    ['Recruteurs bloqués', data.recruiters.blocked],
    ['Candidatures reçues', data.recruiters.shortlisted_candidates],
    ['Entretiens programmés', data.recruiters.interviews_scheduled],
  ];

  return (
    <div className="mb-6 grid gap-3 [grid-template-columns:repeat(auto-fit,minmax(140px,1fr))]">
      {items.map(([label, value]) => (
        <div key={label} className="rounded-card border border-outline-variant bg-surface-lowest p-3">
          <Eyebrow>{label}</Eyebrow>
          <div className="mt-1 font-mono text-xl leading-none tabular-nums text-on-surface">{value}</div>
        </div>
      ))}
    </div>
  );
}

type ConfirmState = { title: string; message: string; confirmLabel: string; danger?: boolean; onConfirm: () => void };

function ConfirmModal({ state, onClose, pending, error }: { state: ConfirmState | null; onClose: () => void; pending: boolean; error: unknown }) {
  return (
    <Modal open={!!state} onClose={onClose} title={state?.title ?? ''}>
      {state && (
        <div className="grid gap-4">
          <p className="text-[14px] text-on-surface-variant">{state.message}</p>
          {!!error && <Notice>{apiErrorMessage(error, "Cela n'a pas fonctionné. Réessayez.")}</Notice>}
          <div className="flex justify-end gap-2">
            <Button variant="ghost" size="compact" onClick={onClose} disabled={pending}>
              Annuler
            </Button>
            <Button variant={state.danger ? 'danger' : 'primary'} size="compact" onClick={state.onConfirm} disabled={pending}>
              {state.confirmLabel}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}

function RecruiterRow({
  recruiter,
  selected,
  onToggleSelect,
  onOpen,
  onAskDelete,
  onSetStatus,
  onVerify,
}: {
  recruiter: AdminRecruiterRow;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: (tab?: string) => void;
  onAskDelete: () => void;
  onSetStatus: (status: AccountStatus) => void;
  onVerify: (verified: boolean) => void;
}) {
  const name = recruiter.name ?? recruiter.phone;

  return (
    <tr className="hover:bg-surface-container/40">
      <td className="py-3 pr-2">
        <Checkbox checked={selected} onChange={onToggleSelect} label={`Sélectionner ${name}`} />
      </td>
      <td className="py-3 pr-3">
        <button onClick={() => onOpen()} className="flex items-center gap-3 border-none bg-transparent p-0 text-left">
          <Avatar name={name} />
          <span className="grid">
            <span className="text-[14px] font-semibold text-on-surface hover:text-primary hover:underline">{name}</span>
            <span className="font-mono text-[12px] text-on-surface-variant">{recruiter.phone}</span>
          </span>
        </button>
      </td>
      <td className="py-3 pr-3">
        <div className="grid">
          <span className="text-[13px] text-on-surface">{recruiter.company_name ?? '—'}</span>
          {recruiter.verified_at && <Badge tone="done">vérifiée</Badge>}
        </div>
      </td>
      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">{recruiter.sector ?? '—'}</td>
      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">{recruiter.email ?? '—'}</td>
      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">{recruiter.city ?? '—'}</td>
      <td className="py-3 pr-3">
        <Badge tone={recruiter.shortlists_count > 0 ? 'done' : 'neutral'}>{recruiter.shortlists_count}</Badge>
      </td>
      <td className="py-3 pr-3">
        <Badge tone={recruiter.interviewing_count > 0 ? 'done' : 'neutral'}>{recruiter.interviewing_count}</Badge>
      </td>
      <td className="py-3 pr-3 text-[12px] text-on-surface-variant">
        {recruiter.last_activity_at ? new Date(recruiter.last_activity_at).toLocaleDateString('fr-FR') : '—'}
      </td>
      <td className="py-3 pr-3">
        <Badge tone={ACCOUNT_STATUS_TONE[recruiter.account_status]}>{ACCOUNT_STATUS_LABELS[recruiter.account_status]}</Badge>
      </td>
      <td className="py-3">
        <div className="flex justify-end">
          <DropdownMenu
            items={[
              { label: 'Voir le profil', onClick: () => onOpen() },
              { label: 'Modifier', onClick: () => onOpen('informations') },
              { label: 'Voir les candidatures', onClick: () => onOpen('candidatures') },
              { label: 'Voir les activités', onClick: () => onOpen('activites') },
              recruiter.verified_at
                ? { label: 'Retirer la vérification', onClick: () => onVerify(false) }
                : { label: 'Vérifier', onClick: () => onVerify(true) },
              recruiter.account_status === 'blocked'
                ? { label: 'Débloquer', onClick: () => onSetStatus('active') }
                : { label: 'Bloquer', onClick: () => onSetStatus('blocked'), tone: 'danger' },
              recruiter.account_status === 'inactive'
                ? { label: 'Réactiver', onClick: () => onSetStatus('active') }
                : { label: 'Désactiver', onClick: () => onSetStatus('inactive'), tone: 'danger' },
              { label: 'Supprimer', onClick: onAskDelete, tone: 'danger' },
            ]}
          />
        </div>
      </td>
    </tr>
  );
}

/** Route `/admin/recruteurs` — même structure que CandidatesPanel, dont c'est le miroir. */
export function RecruitersPanel() {
  const router = useRouter();
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<Filters>(EMPTY_FILTERS);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-recruiters'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/recruiters/${id}`),
    onSuccess: () => {
      setConfirm(null);
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AccountStatus }) => api.patch(`/admin/recruiters/${id}/status`, { status }),
    onSuccess: () => {
      setConfirm(null);
      invalidate();
    },
  });

  const verifyMutation = useMutation({
    mutationFn: ({ id, verified }: { id: number; verified: boolean }) => api.patch(`/admin/recruiters/${id}/verify`, { verified }),
    onSuccess: invalidate,
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: string }) => {
      if (action === 'export') {
        const response = await api.post('/admin/recruiters/bulk', { ids, action }, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `recruteurs-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      await api.post('/admin/recruiters/bulk', { ids, action });
    },
    onSuccess: () => {
      setConfirm(null);
      setSelected([]);
      invalidate();
    },
  });

  const { data, isLoading } = useQuery({
    queryKey: ['admin-recruiters', page, q, filters],
    queryFn: () =>
      api
        .get('/admin/recruiters', {
          params: {
            page,
            q: q || undefined,
            city: filters.city || undefined,
            sector: filters.sector || undefined,
            account_status: filters.account_status || undefined,
            verified: filters.verified || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
          },
        })
        .then((r) => r.data as PaginatedResponse<AdminRecruiterRow>),
  });

  const rows = data?.data ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const openRecruiter = (id: number, tab?: string) => router.push(`/admin/recruteurs/${id}${tab ? `?tab=${tab}` : ''}`);

  const askDelete = (recruiter: AdminRecruiterRow) =>
    setConfirm({
      title: 'Supprimer ce recruteur',
      message: `La fiche entreprise de ${recruiter.name ?? recruiter.phone} sera supprimée (le compte de connexion reste actif).`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: () => deleteMutation.mutate(recruiter.id),
    });

  const askStatus = (recruiter: AdminRecruiterRow, next: AccountStatus) => {
    if (next === 'active') {
      statusMutation.mutate({ id: recruiter.id, status: next });
      return;
    }
    setConfirm({
      title: next === 'blocked' ? 'Bloquer ce recruteur' : 'Désactiver ce recruteur',
      message: `${recruiter.name ?? recruiter.phone} ne pourra plus se connecter à la plateforme.`,
      confirmLabel: next === 'blocked' ? 'Bloquer' : 'Désactiver',
      danger: true,
      onConfirm: () => statusMutation.mutate({ id: recruiter.id, status: next }),
    });
  };

  const askBulk = (action: 'activate' | 'deactivate' | 'block' | 'export' | 'delete') => {
    if (action === 'activate' || action === 'export') {
      bulkMutation.mutate({ ids: selected, action });
      return;
    }
    const labels = { deactivate: 'Désactiver', block: 'Bloquer', delete: 'Supprimer' } as const;
    setConfirm({
      title: `${labels[action]} ${selected.length} recruteur${selected.length > 1 ? 's' : ''}`,
      message: "Cette action groupée s'applique immédiatement à tous les recruteurs sélectionnés.",
      confirmLabel: labels[action],
      danger: true,
      onConfirm: () => bulkMutation.mutate({ ids: selected, action }),
    });
  };

  return (
    <Card>
      <SectionHeader eyebrow="Dossiers" title="Recruteurs" subtitle={isLoading ? 'Chargement…' : undefined} />

      <RecruiterKpis />

      <div className="mb-4 grid gap-2 [grid-template-columns:minmax(160px,2fr)_auto]">
        <Field
          label="Rechercher un recruteur…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Nom, email, téléphone, entreprise, ville, secteur"
        />
        <div className="flex items-end">
          <Button variant="ghost" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={16} />
            Filtres avancés
          </Button>
        </div>
      </div>

      {showFilters && (
        <div className="mb-4 grid gap-3 rounded-card border border-outline-variant bg-surface-container/40 p-4">
          <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
            <Field label="Ville" value={filters.city} onChange={(e) => setFilters({ ...filters, city: e.target.value })} />
            <Field label="Secteur" value={filters.sector} onChange={(e) => setFilters({ ...filters, sector: e.target.value })} />
            <SelectField
              label="Statut du compte"
              value={filters.account_status}
              onChange={(e) => setFilters({ ...filters, account_status: e.target.value })}
            >
              <option value="">Tous</option>
              {Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <SelectField label="Vérification" value={filters.verified} onChange={(e) => setFilters({ ...filters, verified: e.target.value })}>
              <option value="">Indifférent</option>
              <option value="true">Vérifiés</option>
              <option value="false">Non vérifiés</option>
            </SelectField>
            <Field label="Inscrit depuis le" type="date" value={filters.date_from} onChange={(e) => setFilters({ ...filters, date_from: e.target.value })} />
            <Field label="Inscrit jusqu'au" type="date" value={filters.date_to} onChange={(e) => setFilters({ ...filters, date_to: e.target.value })} />
          </div>
          <div>
            <Button
              variant="ghost"
              size="compact"
              onClick={() => {
                setFilters(EMPTY_FILTERS);
                setPage(1);
              }}
            >
              <RotateCcw size={14} />
              Réinitialiser les filtres
            </Button>
          </div>
        </div>
      )}

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[1240px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="pb-2 pr-2">
                <Checkbox checked={allSelected} onChange={(checked) => setSelected(checked ? rows.map((r) => r.id) : [])} label="Tout sélectionner" />
              </th>
              <th className="pb-2 pr-3 font-bold">Recruteur</th>
              <th className="pb-2 pr-3 font-bold">Entreprise</th>
              <th className="pb-2 pr-3 font-bold">Secteur</th>
              <th className="pb-2 pr-3 font-bold">Email</th>
              <th className="pb-2 pr-3 font-bold">Ville</th>
              <th className="pb-2 pr-3 font-bold">Candidatures</th>
              <th className="pb-2 pr-3 font-bold">Entretiens</th>
              <th className="pb-2 pr-3 font-bold">Dernière activité</th>
              <th className="pb-2 pr-3 font-bold">Statut</th>
              <th className="pb-2 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((recruiter) => (
              <RecruiterRow
                key={recruiter.id}
                recruiter={recruiter}
                selected={selected.includes(recruiter.id)}
                onToggleSelect={() =>
                  setSelected((current) => (current.includes(recruiter.id) ? current.filter((id) => id !== recruiter.id) : [...current, recruiter.id]))
                }
                onOpen={(tab) => openRecruiter(recruiter.id, tab)}
                onAskDelete={() => askDelete(recruiter)}
                onSetStatus={(next) => askStatus(recruiter, next)}
                onVerify={(verified) => verifyMutation.mutate({ id: recruiter.id, verified })}
              />
            ))}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 && <p className="helper-text py-4">Aucun recruteur ne correspond.</p>}
      </div>

      <div className="mt-4 grid gap-3">
        <BulkActionBar
          count={selected.length}
          noun="recruteur"
          onClear={() => setSelected([])}
          actions={[
            { label: 'Activer', onClick: () => askBulk('activate') },
            { label: 'Désactiver', onClick: () => askBulk('deactivate') },
            { label: 'Bloquer', onClick: () => askBulk('block'), tone: 'danger' },
            { label: 'Exporter', onClick: () => askBulk('export') },
            { label: 'Supprimer', onClick: () => askBulk('delete'), tone: 'danger' },
          ]}
        />
        <Pagination page={page} data={data} onPage={setPage} noun="recruteur" />
      </div>

      <ConfirmModal
        state={confirm}
        onClose={() => setConfirm(null)}
        pending={deleteMutation.isPending || statusMutation.isPending || bulkMutation.isPending}
        error={deleteMutation.error || statusMutation.error || bulkMutation.error}
      />
    </Card>
  );
}
