'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useRouter, usePathname, useSearchParams } from 'next/navigation';
import { SlidersHorizontal, RotateCcw } from 'lucide-react';
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
  ProgressBar,
  SectionHeader,
  SelectField,
} from '@/components/ui';
import { Pagination } from '@/components/Pagination';
import { EngagementBadge } from '@/components/admin/EngagementBadge';
import { apiErrorMessage } from '@/lib/apiError';
import { ACCOUNT_STATUS_LABELS, type AccountStatus, type AdminCandidateRow, type AdminChecklist } from '@/types/admin';
import type { PaginatedResponse } from '@/types/candidate';

const CHECKLIST_LABELS: [keyof AdminChecklist, string][] = [
  ['profile_completed', 'Profil personnel complété'],
  ['cv_uploaded', 'CV téléversé et analysé'],
  ['certificates_uploaded', 'Certificats téléversés'],
  ['video_recorded', 'Vidéo de présentation enregistrée'],
];

const EDUCATION_LEVELS: [string, string][] = [
  ['general_school', 'Scolaire général'],
  ['vocational', 'Professionnel'],
  ['professional_training', 'Formation qualifiante'],
  ['bachelor', 'Licence'],
  ['master', 'Master'],
  ['other', 'Autre'],
];

const AVAILABILITY_LABELS: Record<string, string> = {
  immediate: 'Immédiate',
  within_1_month: 'Sous 1 mois',
  within_2_months: 'Sous 2 mois',
};

const ACCOUNT_STATUS_TONE: Record<AccountStatus, 'done' | 'pending' | 'error'> = {
  active: 'done',
  inactive: 'pending',
  blocked: 'error',
};

type Metrics = {
  candidates: {
    total: number;
    active: number;
    new_this_week: number;
    profiles_complete: number;
    profiles_incomplete: number;
    in_shortlist: number;
    interviewing: number;
    placed: number;
  };
};

type AdvancedFilters = {
  city: string;
  education_level: string;
  min_experience: string;
  availability_status: string;
  account_status: string;
  profile_complete: string;
  date_from: string;
  date_to: string;
  min_shortlists: string;
};

const EMPTY_ADVANCED_FILTERS: AdvancedFilters = {
  city: '',
  education_level: '',
  min_experience: '',
  availability_status: '',
  account_status: '',
  profile_complete: '',
  date_from: '',
  date_to: '',
  min_shortlists: '',
};

/** Les huit chiffres attendus en haut du module — tirés du même endpoint que le tableau de bord, pas recalculés localement. */
function CandidateKpis() {
  const { data } = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  if (!data) return null;

  const items: [string, number][] = [
    ['Total candidats', data.candidates.total],
    ['Candidats actifs', data.candidates.active],
    ['Nouveaux candidats', data.candidates.new_this_week],
    ['Profils complets', data.candidates.profiles_complete],
    ['Profils incomplets', data.candidates.profiles_incomplete],
    ['Candidatures actives', data.candidates.in_shortlist],
    ['Candidats en entretien', data.candidates.interviewing],
    ['Candidats recrutés', data.candidates.placed],
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

function AdvancedFiltersPanel({
  filters,
  onChange,
  onReset,
}: {
  filters: AdvancedFilters;
  onChange: (next: AdvancedFilters) => void;
  onReset: () => void;
}) {
  const set = <K extends keyof AdvancedFilters>(key: K, value: AdvancedFilters[K]) => onChange({ ...filters, [key]: value });

  return (
    <div className="mb-4 grid gap-3 rounded-card border border-outline-variant bg-surface-container/40 p-4">
      <div className="grid gap-2 [grid-template-columns:repeat(auto-fit,minmax(160px,1fr))]">
        <Field label="Ville" value={filters.city} onChange={(e) => set('city', e.target.value)} placeholder="Casablanca…" />
        <SelectField label="Niveau d'études" value={filters.education_level} onChange={(e) => set('education_level', e.target.value)}>
          <option value="">Tous niveaux</option>
          {EDUCATION_LEVELS.map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <Field
          label="Expérience min. (ans)"
          type="number"
          min={0}
          value={filters.min_experience}
          onChange={(e) => set('min_experience', e.target.value)}
        />
        <SelectField label="Disponibilité" value={filters.availability_status} onChange={(e) => set('availability_status', e.target.value)}>
          <option value="">Toutes</option>
          {Object.entries(AVAILABILITY_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Statut du compte" value={filters.account_status} onChange={(e) => set('account_status', e.target.value)}>
          <option value="">Tous</option>
          {Object.entries(ACCOUNT_STATUS_LABELS).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
        </SelectField>
        <SelectField label="Profil complété" value={filters.profile_complete} onChange={(e) => set('profile_complete', e.target.value)}>
          <option value="">Indifférent</option>
          <option value="true">Complet</option>
          <option value="false">Incomplet</option>
        </SelectField>
        <Field
          label="Inscrit depuis le"
          type="date"
          value={filters.date_from}
          onChange={(e) => set('date_from', e.target.value)}
        />
        <Field label="Inscrit jusqu'au" type="date" value={filters.date_to} onChange={(e) => set('date_to', e.target.value)} />
        <Field
          label="Candidatures min."
          type="number"
          min={0}
          value={filters.min_shortlists}
          onChange={(e) => set('min_shortlists', e.target.value)}
        />
      </div>
      <div>
        <Button variant="ghost" size="compact" onClick={onReset}>
          <RotateCcw size={14} />
          Réinitialiser les filtres
        </Button>
      </div>
    </div>
  );
}

type ConfirmState = {
  title: string;
  message: string;
  confirmLabel: string;
  danger?: boolean;
  onConfirm: () => void;
};

function ConfirmModal({
  state,
  onClose,
  pending,
  error,
}: {
  state: ConfirmState | null;
  onClose: () => void;
  pending: boolean;
  error: unknown;
}) {
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

function CandidateRow({
  candidate,
  selected,
  onToggleSelect,
  onOpen,
  onAskDelete,
  onSetStatus,
}: {
  candidate: AdminCandidateRow;
  selected: boolean;
  onToggleSelect: () => void;
  onOpen: (tab?: string) => void;
  onAskDelete: () => void;
  onSetStatus: (status: AccountStatus) => void;
}) {
  const done = CHECKLIST_LABELS.filter(([key]) => candidate.checklist[key]).length;
  const name = candidate.name ?? candidate.phone;
  const lastActivity = candidate.engagement.last_activity_on;

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
            <span className="font-mono text-[11px] text-on-surface-variant">#{candidate.id}</span>
          </span>
        </button>
      </td>

      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">{candidate.email ?? '—'}</td>
      <td className="py-3 pr-3 font-mono text-[12px] text-on-surface-variant">{candidate.phone}</td>
      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">{candidate.city ?? '—'}</td>

      <td className="py-3 pr-3">
        <div className="flex flex-wrap gap-1">
          {candidate.top_skills.length === 0 && <span className="text-[13px] text-on-surface-variant">—</span>}
          {candidate.top_skills.map((skill) => (
            <Badge key={skill} tone="neutral">
              {skill}
            </Badge>
          ))}
        </div>
      </td>

      <td className="py-3 pr-3 text-[13px] text-on-surface-variant">
        {candidate.availability_status ? AVAILABILITY_LABELS[candidate.availability_status] : '—'}
      </td>

      <td className="py-3 pr-3">
        <Badge tone={candidate.shortlists_count > 0 ? 'done' : 'neutral'}>{candidate.shortlists_count}</Badge>
      </td>

      <td className="py-3 pr-3 text-[12px] text-on-surface-variant">
        {lastActivity ? new Date(lastActivity).toLocaleDateString('fr-FR') : '—'}
      </td>

      <td className="py-3 pr-3">
        <div className="flex items-center gap-2">
          <ProgressBar percent={candidate.completion_percent} className="w-20" />
          <span className="font-mono text-[12px] tabular-nums text-on-surface-variant">{candidate.completion_percent}%</span>
        </div>
      </td>

      <td className="py-3 pr-3">
        <div className="grid gap-1">
          <Badge tone={ACCOUNT_STATUS_TONE[candidate.account_status]}>{ACCOUNT_STATUS_LABELS[candidate.account_status]}</Badge>
          <Badge tone={candidate.verified_at ? 'done' : 'pending'}>
            {candidate.verified_at ? 'vérifié' : candidate.submitted_at ? 'soumis' : 'brouillon'}
          </Badge>
        </div>
      </td>

      <td className="py-3">
        <div className="flex items-center justify-end gap-2">
          <EngagementBadge engagement={candidate.engagement} />
          <DropdownMenu
            items={[
              { label: 'Voir le profil', onClick: () => onOpen() },
              { label: 'Modifier', onClick: () => onOpen('informations') },
              { label: 'Voir le CV', onClick: () => onOpen('cv') },
              { label: 'Voir les candidatures', onClick: () => onOpen('candidatures') },
              { label: 'Voir les activités', onClick: () => onOpen('activites') },
              { label: 'Voir l’historique', onClick: () => onOpen('historique') },
              candidate.account_status === 'blocked'
                ? { label: 'Débloquer', onClick: () => onSetStatus('active') }
                : { label: 'Bloquer', onClick: () => onSetStatus('blocked'), tone: 'danger' },
              candidate.account_status === 'inactive'
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

/**
 * Route `/admin/candidats`. Ouvrir un dossier navigue vers
 * `/admin/candidats/:id` plutôt que de basculer un `useState` du parent — le
 * bouton retour du navigateur redevient ce qu'il est partout ailleurs.
 *
 * Seul `status` vit dans l'URL : c'est le seul des filtres que la page
 * d'aperçu doit pouvoir présélectionner (`?status=submitted`). Le reste
 * (recherche, filtres avancés, sélection) reste en `useState` local — ce
 * n'est jamais un lien externe qui les fixe.
 */
export function CandidatesPanel() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const status = searchParams.get('status') ?? '';
  const queryClient = useQueryClient();

  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [showFilters, setShowFilters] = useState(false);
  const [filters, setFilters] = useState<AdvancedFilters>(EMPTY_ADVANCED_FILTERS);
  const [selected, setSelected] = useState<number[]>([]);
  const [confirm, setConfirm] = useState<ConfirmState | null>(null);

  const invalidate = () => queryClient.invalidateQueries({ queryKey: ['admin-candidates'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => api.delete(`/admin/candidates/${id}`),
    onSuccess: () => {
      setConfirm(null);
      invalidate();
    },
  });

  const statusMutation = useMutation({
    mutationFn: ({ id, status }: { id: number; status: AccountStatus }) => api.patch(`/admin/candidates/${id}/status`, { status }),
    onSuccess: () => {
      setConfirm(null);
      invalidate();
    },
  });

  const bulkMutation = useMutation({
    mutationFn: async ({ ids, action }: { ids: number[]; action: string }) => {
      if (action === 'export') {
        const response = await api.post('/admin/candidates/bulk', { ids, action }, { responseType: 'blob' });
        const url = URL.createObjectURL(response.data as Blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `candidats-${new Date().toISOString().slice(0, 10)}.csv`;
        link.click();
        URL.revokeObjectURL(url);
        return;
      }
      await api.post('/admin/candidates/bulk', { ids, action });
    },
    onSuccess: () => {
      setConfirm(null);
      setSelected([]);
      invalidate();
    },
  });

  const setStatus = (value: string) => {
    const next = new URLSearchParams(searchParams.toString());
    if (value) next.set('status', value);
    else next.delete('status');
    router.push(next.size > 0 ? `${pathname}?${next.toString()}` : pathname);
  };

  const { data, isLoading } = useQuery({
    queryKey: ['admin-candidates', page, q, status, filters],
    queryFn: () =>
      api
        .get('/admin/candidates', {
          params: {
            page,
            q: q || undefined,
            status: status || undefined,
            city: filters.city || undefined,
            education_level: filters.education_level || undefined,
            min_experience: filters.min_experience || undefined,
            availability_status: filters.availability_status || undefined,
            account_status: filters.account_status || undefined,
            profile_complete: filters.profile_complete || undefined,
            date_from: filters.date_from || undefined,
            date_to: filters.date_to || undefined,
            min_shortlists: filters.min_shortlists || undefined,
          },
        })
        .then((r) => r.data as PaginatedResponse<AdminCandidateRow>),
  });

  const rows = data?.data ?? [];
  const allSelected = rows.length > 0 && rows.every((r) => selected.includes(r.id));

  const openCandidate = (id: number, tab?: string) => router.push(`/admin/candidats/${id}${tab ? `?tab=${tab}` : ''}`);

  const askDelete = (candidate: AdminCandidateRow) =>
    setConfirm({
      title: 'Supprimer ce candidat',
      message: `Le dossier de ${candidate.name ?? candidate.phone} sera définitivement supprimé (le compte de connexion reste actif).`,
      confirmLabel: 'Supprimer',
      danger: true,
      onConfirm: () => deleteMutation.mutate(candidate.id),
    });

  const askStatus = (candidate: AdminCandidateRow, next: AccountStatus) => {
    if (next === 'active') {
      statusMutation.mutate({ id: candidate.id, status: next });
      return;
    }
    setConfirm({
      title: next === 'blocked' ? 'Bloquer ce candidat' : 'Désactiver ce candidat',
      message: `${candidate.name ?? candidate.phone} ne pourra plus se connecter à la plateforme.`,
      confirmLabel: next === 'blocked' ? 'Bloquer' : 'Désactiver',
      danger: true,
      onConfirm: () => statusMutation.mutate({ id: candidate.id, status: next }),
    });
  };

  const askBulk = (action: 'activate' | 'deactivate' | 'block' | 'export' | 'delete') => {
    if (action === 'activate' || action === 'export') {
      bulkMutation.mutate({ ids: selected, action });
      return;
    }
    const labels = { deactivate: 'Désactiver', block: 'Bloquer', delete: 'Supprimer' } as const;
    setConfirm({
      title: `${labels[action]} ${selected.length} candidat${selected.length > 1 ? 's' : ''}`,
      message: "Cette action groupée s'applique immédiatement à tous les candidats sélectionnés.",
      confirmLabel: labels[action],
      danger: true,
      onConfirm: () => bulkMutation.mutate({ ids: selected, action }),
    });
  };

  return (
    <Card>
      <SectionHeader
        eyebrow="Dossiers"
        title="Candidats"
        subtitle={isLoading ? 'Chargement…' : undefined}
      />

      <CandidateKpis />

      <div className="mb-4 grid gap-2 [grid-template-columns:minmax(160px,2fr)_minmax(140px,1fr)_auto]">
        <Field
          label="Rechercher un candidat…"
          value={q}
          onChange={(e) => {
            setQ(e.target.value);
            setPage(1);
          }}
          placeholder="Nom, prénom, email, téléphone, ville, compétence"
        />
        <SelectField
          label="Étape"
          value={status}
          onChange={(e) => {
            setStatus(e.target.value);
            setPage(1);
          }}
        >
          <option value="">Tout le monde</option>
          <option value="draft">Encore un brouillon</option>
          <option value="submitted">Soumis, non vérifié</option>
          <option value="verified">Vérifié</option>
        </SelectField>
        <div className="flex items-end">
          <Button variant="ghost" size="default" onClick={() => setShowFilters((v) => !v)}>
            <SlidersHorizontal size={16} />
            Filtres avancés
          </Button>
        </div>
      </div>

      {showFilters && (
        <AdvancedFiltersPanel
          filters={filters}
          onChange={(next) => {
            setFilters(next);
            setPage(1);
          }}
          onReset={() => {
            setFilters(EMPTY_ADVANCED_FILTERS);
            setPage(1);
          }}
        />
      )}

      <div className="-mx-6 overflow-x-auto px-6">
        <table className="w-full min-w-[1360px] border-collapse text-left">
          <thead>
            <tr className="border-b border-outline-variant text-[11px] font-bold uppercase tracking-wider text-on-surface-variant">
              <th className="pb-2 pr-2">
                <Checkbox
                  checked={allSelected}
                  onChange={(checked) => setSelected(checked ? rows.map((r) => r.id) : [])}
                  label="Tout sélectionner"
                />
              </th>
              <th className="pb-2 pr-3 font-bold">Candidat</th>
              <th className="pb-2 pr-3 font-bold">Email</th>
              <th className="pb-2 pr-3 font-bold">Téléphone</th>
              <th className="pb-2 pr-3 font-bold">Ville</th>
              <th className="pb-2 pr-3 font-bold">Compétences</th>
              <th className="pb-2 pr-3 font-bold">Disponibilité</th>
              <th className="pb-2 pr-3 font-bold">Candidatures</th>
              <th className="pb-2 pr-3 font-bold">Dernière activité</th>
              <th className="pb-2 pr-3 font-bold">Profil</th>
              <th className="pb-2 pr-3 font-bold">Statut</th>
              <th className="pb-2 text-right font-bold">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant">
            {rows.map((candidate) => (
              <CandidateRow
                key={candidate.id}
                candidate={candidate}
                selected={selected.includes(candidate.id)}
                onToggleSelect={() =>
                  setSelected((current) =>
                    current.includes(candidate.id) ? current.filter((id) => id !== candidate.id) : [...current, candidate.id],
                  )
                }
                onOpen={(tab) => openCandidate(candidate.id, tab)}
                onAskDelete={() => askDelete(candidate)}
                onSetStatus={(next) => askStatus(candidate, next)}
              />
            ))}
          </tbody>
        </table>

        {!isLoading && rows.length === 0 && <p className="helper-text py-4">Aucun candidat ne correspond.</p>}
      </div>

      <div className="mt-4 grid gap-3">
        <BulkActionBar
          count={selected.length}
          noun="candidat"
          onClear={() => setSelected([])}
          actions={[
            { label: 'Activer', onClick: () => askBulk('activate') },
            { label: 'Désactiver', onClick: () => askBulk('deactivate') },
            { label: 'Bloquer', onClick: () => askBulk('block'), tone: 'danger' },
            { label: 'Exporter', onClick: () => askBulk('export') },
            { label: 'Supprimer', onClick: () => askBulk('delete'), tone: 'danger' },
          ]}
        />
        <Pagination page={page} data={data} onPage={setPage} noun="candidat" />
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
