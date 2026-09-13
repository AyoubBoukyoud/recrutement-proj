'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import type { Page } from '@/lib/candidateMarketplace';
import { Modal, ModalActions } from '@/components/amud/ui';
import { FormGrid, SelectField, TextareaField, TextField } from '@/components/amud/form';
import { useToast } from '@/components/amud/Toast';
import { Pagination } from '@/components/Pagination';

/*
 * Supervision des offres — porte le style de la maquette
 * `/amud/admin/offres` (KPI, recherche/filtres, tableau, menu d'action) sur
 * le vrai backend (`GET/PATCH /admin/offers*`, déjà utilisé par l'ancienne
 * version une ligne de cette page). Filtres alignés sur ce que
 * `AdminMarketplaceController::offers` accepte réellement (`q`, `status`) —
 * pas de filtre entreprise/secteur côté serveur, contrairement à la maquette.
 */
type OfferRow = {
  id: number;
  title: string;
  city: string;
  country: string;
  contract_type: string;
  status: 'draft' | 'published' | 'closed';
  applications_count: number;
  published_at: string | null;
  employer: { id: number; name: string | null; company_profile?: { company_name?: string | null } | null } | null;
};

type Metrics = { marketplace: { offers_draft: number; offers_published: number; applications_pending: number } };

const STATUS_LABEL: Record<OfferRow['status'], string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  closed: 'Fermée',
};

const STATUS_CLASS: Record<OfferRow['status'], string> = {
  draft: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  published: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  closed: 'bg-amud-error-container text-amud-on-error-container',
};

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string } | undefined;
    return data?.message ?? fallback;
  }
  return fallback;
}

type RecruiterOption = { id: number; name: string | null; phone: string; company_name: string | null };

const CONTRACT_TYPE_OPTIONS = [
  { value: 'permanent', label: 'CDI' },
  { value: 'fixed_term', label: 'CDD' },
  { value: 'apprenticeship', label: 'Apprentissage' },
  { value: 'temporary', label: 'Intérim' },
  { value: 'internship', label: 'Stage' },
];

const WORKPLACE_TYPE_OPTIONS = [
  { value: 'onsite', label: 'Sur site' },
  { value: 'hybrid', label: 'Hybride' },
  { value: 'remote', label: 'Télétravail' },
];

const EXPERIENCE_LEVEL_OPTIONS = [
  { value: 'none', label: 'Aucune' },
  { value: 'less_than_one', label: "Moins d'un an" },
  { value: 'one_to_three', label: '1 à 3 ans' },
  { value: 'three_to_five', label: '3 à 5 ans' },
  { value: 'five_plus', label: '5 ans et plus' },
];

const EDUCATION_LEVEL_OPTIONS = [
  { value: 'none', label: 'Aucun' },
  { value: 'vocational', label: 'Formation professionnelle' },
  { value: 'high_school', label: 'Baccalauréat' },
  { value: 'bachelor', label: 'Licence' },
  { value: 'master', label: 'Master' },
  { value: 'doctorate', label: 'Doctorat' },
];

const CEFR_LEVEL_OPTIONS = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((v) => ({ value: v, label: v }));

const OFFER_STATUS_OPTIONS = [
  { value: 'draft', label: 'Brouillon' },
  { value: 'published', label: 'Publiée' },
  { value: 'closed', label: 'Fermée' },
];

const EMPTY_OFFER_FORM = {
  user_id: '',
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  sector: '',
  city: '',
  country: '',
  workplace_type: '',
  weekly_hours: '',
  experience_level: '',
  education_level: '',
  required_cefr_level: '',
  salary_min: '',
  salary_max: '',
  currency: '',
  contract_type: 'permanent',
  start_date: '',
  application_deadline: '',
  positions_count: '',
  status: 'draft',
};

export default function AdminOffresPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [status, setStatus] = useState('');
  const [page, setPage] = useState(1);
  const [openMenu, setOpenMenu] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [recruiterSearch, setRecruiterSearch] = useState('');
  const [form, setForm] = useState(EMPTY_OFFER_FORM);

  const metrics = useQuery({
    queryKey: ['admin-metrics'],
    queryFn: () => api.get('/admin/metrics').then((r) => r.data as Metrics),
  });

  const offers = useQuery({
    queryKey: ['admin-offers', search, status, page],
    queryFn: () =>
      api
        .get('/admin/offers', { params: { q: search || undefined, status: status || undefined, page } })
        .then((r) => r.data as Page<OfferRow>),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['admin-offers'] });

  const recruiterOptions = useQuery({
    queryKey: ['admin-offer-recruiter-options', recruiterSearch],
    queryFn: () =>
      api
        .get('/admin/recruiters', { params: { q: recruiterSearch || undefined, page: 1 } })
        .then((r) => r.data as Page<RecruiterOption>),
    enabled: creating,
  });

  const create = useMutation({
    mutationFn: () =>
      api.post('/admin/offers', {
        user_id: Number(form.user_id),
        title: form.title.trim(),
        description: form.description.trim(),
        responsibilities: form.responsibilities.trim() || undefined,
        requirements: form.requirements.trim() || undefined,
        benefits: form.benefits.trim() || undefined,
        sector: form.sector.trim(),
        city: form.city.trim(),
        country: form.country.trim() || undefined,
        workplace_type: form.workplace_type || undefined,
        weekly_hours: form.weekly_hours ? Number(form.weekly_hours) : undefined,
        experience_level: form.experience_level || undefined,
        education_level: form.education_level || undefined,
        required_cefr_level: form.required_cefr_level || undefined,
        salary_min: form.salary_min ? Number(form.salary_min) : undefined,
        salary_max: form.salary_max ? Number(form.salary_max) : undefined,
        currency: form.currency.trim() || undefined,
        contract_type: form.contract_type,
        start_date: form.start_date || undefined,
        application_deadline: form.application_deadline || undefined,
        positions_count: form.positions_count ? Number(form.positions_count) : undefined,
        status: form.status,
      }),
    onSuccess: () => {
      notify('Offre créée.');
      setCreating(false);
      setForm(EMPTY_OFFER_FORM);
      setRecruiterSearch('');
      refresh();
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (error) => notify(errorMessage(error, "La création a échoué."), 'error'),
  });

  const setOfferStatus = useMutation({
    mutationFn: ({ id, next }: { id: number; next: OfferRow['status'] }) =>
      api.patch(`/admin/offers/${id}`, { status: next, reason: next === 'published' ? null : 'Modération administrateur' }),
    onSuccess: (_data, variables) => {
      setOpenMenu(null);
      notify(`Statut mis à jour : ${STATUS_LABEL[variables.next]}.`);
      refresh();
      qc.invalidateQueries({ queryKey: ['admin-metrics'] });
    },
    onError: (error) => notify(errorMessage(error, 'Action impossible.'), 'error'),
  });

  function submitSearch(e: React.FormEvent) {
    e.preventDefault();
    setSearch(searchInput);
    setPage(1);
  }

  const rows = offers.data?.data ?? [];
  const m = metrics.data?.marketplace;

  return (
    <div>
      <div className="mb-lg flex flex-wrap items-end justify-between gap-md">
        <div>
          <h2 className="text-headline-lg text-amud-on-surface">Gestion des offres</h2>
          <p className="mt-1 text-body-md text-amud-on-surface-variant">Modération et suivi des offres d’emploi publiées sur la plateforme.</p>
        </div>
        <button
          onClick={() => setCreating(true)}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-amud-primary px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          Ajouter une offre
        </button>
      </div>

      <div className="mb-lg grid grid-cols-2 gap-md md:grid-cols-4">
        {[
          { label: 'Total (page)', value: offers.data?.total },
          { label: 'Brouillons', value: m?.offers_draft },
          { label: 'Publiées', value: m?.offers_published },
          { label: 'Candidatures en attente', value: m?.applications_pending },
        ].map((k) => (
          <div key={k.label} className="relative flex flex-col items-start justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
            <div className="absolute bottom-0 left-0 top-0 w-1 bg-amud-primary" />
            <span className="mb-1 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">{k.label}</span>
            <span className="text-headline-lg text-amud-on-surface">{k.value ?? '—'}</span>
          </div>
        ))}
      </div>

      <form onSubmit={submitSearch} className="mb-md flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-[0_4px_12px_rgba(0,0,0,0.02)] md:flex-row">
        <div className="relative w-full flex-1">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
          <input
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-4 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary"
            placeholder="Rechercher par titre, ville, secteur…"
            type="text"
          />
        </div>
        <div className="flex w-full gap-2 overflow-x-auto pb-1 md:w-auto md:pb-0">
          <select
            value={status}
            onChange={(e) => {
              setStatus(e.target.value);
              setPage(1);
            }}
            className="rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary"
          >
            <option value="">Statut : tous</option>
            <option value="draft">Brouillon</option>
            <option value="published">Publiée</option>
            <option value="closed">Fermée</option>
          </select>
          <button type="submit" className="rounded-lg border border-amud-outline-variant px-4 py-2 text-label-md font-medium text-amud-on-surface hover:bg-amud-surface-container-low">
            Filtrer
          </button>
        </div>
      </form>

      <div className="overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-[0_4px_12px_rgba(0,0,0,0.02)]">
        <table className="w-full min-w-[720px] border-collapse text-left">
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50">
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Offre &amp; entreprise</th>
              <th className="hidden px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant md:table-cell">Lieu &amp; contrat</th>
              <th className="hidden px-6 py-4 text-center text-label-sm uppercase tracking-wider text-amud-on-surface-variant sm:table-cell">Candidatures</th>
              <th className="px-6 py-4 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Statut</th>
              <th className="px-6 py-4 text-right text-label-sm uppercase tracking-wider text-amud-on-surface-variant">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {offers.isLoading ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Chargement…
                </td>
              </tr>
            ) : null}
            {!offers.isLoading && rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-10 text-center text-body-md text-amud-on-surface-variant">
                  Aucune offre ne correspond à ces filtres.
                </td>
              </tr>
            ) : null}
            {rows.map((o) => {
              const employerName = o.employer?.company_profile?.company_name || o.employer?.name || 'Entreprise';
              return (
                <tr key={o.id} className="transition-colors hover:bg-amud-surface-container-lowest/50">
                  <td className="px-6 py-4">
                    <p className="font-semibold text-amud-on-surface">{o.title}</p>
                    <p className="text-label-sm text-amud-on-surface-variant">{employerName}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-body-md text-amud-on-surface-variant md:table-cell">
                    {o.city}
                    <p className="text-label-sm">{o.contract_type}</p>
                  </td>
                  <td className="hidden px-6 py-4 text-center text-amud-on-surface sm:table-cell">{o.applications_count}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[o.status]}`}>{STATUS_LABEL[o.status]}</span>
                  </td>
                  <td className="relative px-6 py-4 text-right">
                    <button onClick={() => setOpenMenu(openMenu === o.id ? null : o.id)} className="p-1 text-amud-on-surface-variant transition-colors hover:text-amud-primary">
                      <span className="material-symbols-outlined">more_vert</span>
                    </button>
                    {openMenu === o.id ? (
                      <div className="absolute right-6 top-12 z-10 w-48 rounded-lg border border-amud-outline-variant bg-amud-surface py-1 text-left shadow-lg animate-amud-fade-in">
                        {o.status !== 'published' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'published' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Publier
                          </button>
                        ) : null}
                        {o.status !== 'draft' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'draft' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-on-surface hover:bg-amud-surface-container-low">
                            Remettre en brouillon
                          </button>
                        ) : null}
                        {o.status !== 'closed' ? (
                          <button onClick={() => setOfferStatus.mutate({ id: o.id, next: 'closed' })} className="block w-full px-4 py-2 text-left text-label-md text-amud-error hover:bg-amud-surface-container-low">
                            Fermer
                          </button>
                        ) : null}
                      </div>
                    ) : null}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="mt-md">
        <Pagination page={page} data={offers.data} onPage={setPage} noun="offre" />
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="Ajouter une offre"
        subtitle="Publie une offre pour le compte d'un recruteur existant."
        widthClassName="max-w-2xl"
        footer={
          <ModalActions
            onCancel={() => setCreating(false)}
            submitLabel={create.isPending ? 'Création…' : 'Créer l’offre'}
            form="create-offer-form"
            disabled={create.isPending || !form.user_id || !form.title.trim() || !form.description.trim() || !form.sector.trim() || !form.city.trim()}
          />
        }
      >
        <FormGrid
          id="create-offer-form"
          onSubmit={(e) => {
            e.preventDefault();
            create.mutate();
          }}
        >
          <TextField
            label="Rechercher un recruteur"
            className="sm:col-span-2"
            value={recruiterSearch}
            onChange={(e) => setRecruiterSearch(e.target.value)}
            placeholder="Nom, entreprise ou téléphone…"
            hint="Filtre la liste ci-dessous."
          />
          <SelectField
            label="Recruteur"
            required
            className="sm:col-span-2"
            value={form.user_id}
            onChange={(e) => setForm({ ...form, user_id: e.target.value })}
            placeholder={recruiterOptions.isLoading ? 'Chargement…' : 'Choisir un recruteur'}
            options={(recruiterOptions.data?.data ?? []).map((r) => ({
              value: String(r.id),
              label: r.company_name || r.name || r.phone,
            }))}
          />
          <TextField
            label="Titre du poste"
            required
            className="sm:col-span-2"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            placeholder="Soudeur qualifié"
          />
          <TextareaField
            label="Description"
            required
            className="sm:col-span-2"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
          />
          <TextareaField
            label="Missions"
            className="sm:col-span-2"
            value={form.responsibilities}
            onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
          />
          <TextareaField
            label="Profil recherché"
            className="sm:col-span-2"
            value={form.requirements}
            onChange={(e) => setForm({ ...form, requirements: e.target.value })}
          />
          <TextareaField
            label="Avantages"
            className="sm:col-span-2"
            value={form.benefits}
            onChange={(e) => setForm({ ...form, benefits: e.target.value })}
          />
          <TextField
            label="Secteur"
            required
            value={form.sector}
            onChange={(e) => setForm({ ...form, sector: e.target.value })}
          />
          <TextField
            label="Ville"
            required
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
          />
          <TextField
            label="Pays"
            value={form.country}
            onChange={(e) => setForm({ ...form, country: e.target.value })}
          />
          <SelectField
            label="Mode de travail"
            placeholder="Non précisé"
            value={form.workplace_type}
            onChange={(e) => setForm({ ...form, workplace_type: e.target.value })}
            options={WORKPLACE_TYPE_OPTIONS}
          />
          <SelectField
            label="Type de contrat"
            required
            value={form.contract_type}
            onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
            options={CONTRACT_TYPE_OPTIONS}
          />
          <TextField
            label="Heures / semaine"
            type="number"
            min={1}
            max={80}
            value={form.weekly_hours}
            onChange={(e) => setForm({ ...form, weekly_hours: e.target.value })}
          />
          <SelectField
            label="Expérience requise"
            placeholder="Non précisée"
            value={form.experience_level}
            onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
            options={EXPERIENCE_LEVEL_OPTIONS}
          />
          <SelectField
            label="Niveau d'études"
            placeholder="Non précisé"
            value={form.education_level}
            onChange={(e) => setForm({ ...form, education_level: e.target.value })}
            options={EDUCATION_LEVEL_OPTIONS}
          />
          <SelectField
            label="Niveau de langue (CECR)"
            placeholder="Non précisé"
            value={form.required_cefr_level}
            onChange={(e) => setForm({ ...form, required_cefr_level: e.target.value })}
            options={CEFR_LEVEL_OPTIONS}
          />
          <TextField
            label="Salaire min."
            type="number"
            min={0}
            value={form.salary_min}
            onChange={(e) => setForm({ ...form, salary_min: e.target.value })}
          />
          <TextField
            label="Salaire max."
            type="number"
            min={0}
            value={form.salary_max}
            onChange={(e) => setForm({ ...form, salary_max: e.target.value })}
          />
          <TextField
            label="Devise"
            value={form.currency}
            onChange={(e) => setForm({ ...form, currency: e.target.value })}
            placeholder="EUR"
          />
          <TextField
            label="Postes à pourvoir"
            type="number"
            min={1}
            max={999}
            value={form.positions_count}
            onChange={(e) => setForm({ ...form, positions_count: e.target.value })}
          />
          <TextField
            label="Date de début"
            type="date"
            value={form.start_date}
            onChange={(e) => setForm({ ...form, start_date: e.target.value })}
          />
          <TextField
            label="Date limite de candidature"
            type="date"
            value={form.application_deadline}
            onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
          />
          <SelectField
            label="Statut"
            className="sm:col-span-2"
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={OFFER_STATUS_OPTIONS}
          />
        </FormGrid>
      </Modal>
    </div>
  );
}
