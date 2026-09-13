'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { ConfirmDialog, Modal, PageHeader } from '@/components/amud/ui';
import { FormSection, SelectField, TextareaField, TextField } from '@/components/amud/form';
import { Button } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import type { Page, JobOffer } from '@/lib/candidateMarketplace';

/*
 * Mes offres — porte le style de la maquette `/amud/entreprise/offres` sur
 * la page déjà pleinement fonctionnelle (création/édition/suppression,
 * salaire, niveau d'allemand exigé) : même logique métier, présentation
 * amud pour rester cohérent avec la nouvelle coquille `RecruiterShell`.
 */
type OwnOffer = JobOffer & {
  status: 'draft' | 'published' | 'closed';
  applications_count: number;
};

type OfferForm = {
  title: string;
  description: string;
  responsibilities: string;
  requirements: string;
  benefits: string;
  sector: string;
  city: string;
  country: string;
  workplace_type: string;
  weekly_hours: string;
  experience_level: string;
  education_level: string;
  contract_type: string;
  required_cefr_level: string;
  salary_min: string;
  salary_max: string;
  currency: string;
  start_date: string;
  application_deadline: string;
  positions_count: string;
  status: string;
};

const EMPTY: OfferForm = {
  title: '',
  description: '',
  responsibilities: '',
  requirements: '',
  benefits: '',
  sector: '',
  city: '',
  country: 'Germany',
  workplace_type: 'onsite',
  weekly_hours: '',
  experience_level: '',
  education_level: '',
  contract_type: 'permanent',
  required_cefr_level: '',
  salary_min: '',
  salary_max: '',
  currency: 'EUR',
  start_date: '',
  application_deadline: '',
  positions_count: '1',
  status: 'draft',
};

const CONTRACTS: Record<string, string> = {
  permanent: 'CDI',
  fixed_term: 'CDD',
  apprenticeship: 'Apprentissage',
  temporary: 'Intérim',
  internship: 'Stage',
};

const WORKPLACE_TYPES: Record<string, string> = {
  onsite: 'Sur site',
  hybrid: 'Hybride',
  remote: 'Télétravail',
};

const EXPERIENCE_LEVELS: Record<string, string> = {
  none: 'Débutant accepté',
  less_than_one: 'Moins d’un an',
  one_to_three: '1 à 3 ans',
  three_to_five: '3 à 5 ans',
  five_plus: '5 ans ou plus',
};

const EDUCATION_LEVELS: Record<string, string> = {
  none: 'Aucun diplôme exigé',
  vocational: 'Formation professionnelle',
  high_school: 'Bac ou équivalent',
  bachelor: 'Licence / Bac+3',
  master: 'Master / Bac+5',
  doctorate: 'Doctorat',
};

const CURRENCIES = ['EUR', 'MAD', 'CHF'] as const;

const STATUSES: Record<OwnOffer['status'], string> = {
  draft: 'Brouillon',
  published: 'Publiée',
  closed: 'Fermée',
};

const STATUS_CLASS: Record<OwnOffer['status'], string> = {
  draft: 'bg-amud-surface-container-highest text-amud-on-surface-variant',
  published: 'bg-amud-primary-fixed text-amud-on-primary-fixed',
  closed: 'bg-amud-error-container text-amud-on-error-container',
};

function errorMessage(error: unknown, fallback: string) {
  if (isAxiosError(error)) {
    const data = error.response?.data as { message?: string; errors?: Record<string, string[]> } | undefined;
    return (data?.errors ? Object.values(data.errors)[0]?.[0] : undefined) ?? data?.message ?? fallback;
  }
  return fallback;
}

function dateInputValue(value: string | null) {
  return value?.slice(0, 10) ?? '';
}

/** Les champs numériques partent en null plutôt qu'en chaîne vide : `nullable|integer`. */
function payloadFrom(form: OfferForm) {
  return {
    ...form,
    responsibilities: form.responsibilities || null,
    requirements: form.requirements || null,
    benefits: form.benefits || null,
    workplace_type: form.workplace_type || null,
    weekly_hours: form.weekly_hours ? Number(form.weekly_hours) : null,
    experience_level: form.experience_level || null,
    education_level: form.education_level || null,
    required_cefr_level: form.required_cefr_level || null,
    salary_min: form.salary_min ? Number(form.salary_min) : null,
    salary_max: form.salary_max ? Number(form.salary_max) : null,
    start_date: form.start_date || null,
    application_deadline: form.application_deadline || null,
    positions_count: Number(form.positions_count) || 1,
  };
}

export default function RecruiterOffresPage() {
  const notify = useToast();
  const qc = useQueryClient();
  const [form, setForm] = useState<OfferForm>(EMPTY);
  const [editing, setEditing] = useState<number | null>(null);
  const [open, setOpen] = useState(false);
  const [deleting, setDeleting] = useState<OwnOffer | null>(null);

  const q = useQuery({
    queryKey: ['recruiter-offers'],
    queryFn: () => api.get('/recruiter/offers').then((r) => r.data as Page<OwnOffer>),
  });

  const close = () => {
    setOpen(false);
    setEditing(null);
    setForm(EMPTY);
    save.reset();
  };

  const save = useMutation({
    mutationFn: () => (editing ? api.patch(`/recruiter/offers/${editing}`, payloadFrom(form)) : api.post('/recruiter/offers', payloadFrom(form))),
    onSuccess: () => {
      close();
      notify(editing ? 'Offre mise à jour.' : 'Offre créée.');
      qc.invalidateQueries({ queryKey: ['recruiter-offers'] });
    },
    onError: (error) => notify(errorMessage(error, 'Enregistrement impossible.'), 'error'),
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/recruiter/offers/${id}`),
    onSuccess: () => {
      setDeleting(null);
      notify('Offre supprimée.', 'info');
      qc.invalidateQueries({ queryKey: ['recruiter-offers'] });
    },
    onError: (error) => notify(errorMessage(error, 'Suppression impossible.'), 'error'),
  });

  const startCreate = () => {
    setEditing(null);
    setForm(EMPTY);
    save.reset();
    setOpen(true);
  };

  const startEdit = (o: OwnOffer) => {
    setEditing(o.id);
    setForm({
      title: o.title,
      description: o.description,
      responsibilities: o.responsibilities ?? '',
      requirements: o.requirements ?? '',
      benefits: o.benefits ?? '',
      sector: o.sector,
      city: o.city,
      country: o.country,
      workplace_type: o.workplace_type ?? '',
      weekly_hours: o.weekly_hours != null ? String(o.weekly_hours) : '',
      experience_level: o.experience_level ?? '',
      education_level: o.education_level ?? '',
      contract_type: o.contract_type,
      required_cefr_level: o.required_cefr_level ?? '',
      salary_min: o.salary_min != null ? String(o.salary_min) : '',
      salary_max: o.salary_max != null ? String(o.salary_max) : '',
      currency: o.currency,
      start_date: dateInputValue(o.start_date),
      application_deadline: dateInputValue(o.application_deadline),
      positions_count: String(o.positions_count ?? 1),
      status: o.status,
    });
    save.reset();
    setOpen(true);
  };

  const offers = q.data?.data ?? [];
  const salaryInvalid = Boolean(form.salary_min && form.salary_max && Number(form.salary_max) < Number(form.salary_min));
  const incomplete =
    !form.title ||
    !form.description ||
    !form.responsibilities ||
    !form.requirements ||
    !form.sector ||
    !form.city ||
    !form.country ||
    !form.contract_type ||
    !form.workplace_type ||
    !form.positions_count ||
    salaryInvalid;

  return (
    <div>
      <PageHeader
        title="Mes offres"
        subtitle={
          q.isLoading
            ? 'Chargement…'
            : `${offers.length} offre${offers.length > 1 ? 's' : ''} · ${offers.filter((o) => o.status === 'published').length} publiée${offers.filter((o) => o.status === 'published').length > 1 ? 's' : ''}`
        }
        actionLabel="Nouvelle offre"
        onAction={startCreate}
      />

      {q.isError ? <p className="mb-md rounded-lg bg-amud-error-container p-md text-body-md text-amud-on-error-container">Impossible de charger vos offres. Rechargez la page.</p> : null}

      {!q.isLoading && offers.length === 0 ? (
        <div className="flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-xl text-center">
          <span className="material-symbols-outlined text-4xl text-amud-outline">work_off</span>
          <p className="font-semibold text-amud-on-surface">Aucune offre pour l’instant</p>
          <p className="max-w-sm text-body-md text-amud-on-surface-variant">
            Une offre publiée devient visible par les candidats dont le dossier correspond, et leur est signalée automatiquement.
          </p>
          <Button onClick={startCreate}>Créer ma première offre</Button>
        </div>
      ) : null}

      <div className="grid gap-md">
        {offers.map((o) => (
          <div key={o.id} className="grid gap-sm rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-[0_4px_12px_rgba(0,0,0,0.02)] sm:grid-cols-[1fr_auto] sm:items-start">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-title-lg text-amud-on-surface">{o.title}</h2>
                <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${STATUS_CLASS[o.status]}`}>{STATUSES[o.status]}</span>
              </div>
              <p className="mt-1 text-label-md text-amud-on-surface-variant">
                {[o.sector, o.city, CONTRACTS[o.contract_type] ?? o.contract_type].filter(Boolean).join(' · ')}
                {o.required_cefr_level ? ` · allemand ${o.required_cefr_level}` : ''}
                {o.salary_min || o.salary_max ? ` · ${[o.salary_min, o.salary_max].filter(Boolean).join('–')} ${o.currency ?? ''}`.trimEnd() : ''}
              </p>
              <p className="mt-1 text-label-sm text-amud-on-surface-variant">
                {[
                  o.workplace_type ? WORKPLACE_TYPES[o.workplace_type] ?? o.workplace_type : null,
                  o.experience_level ? EXPERIENCE_LEVELS[o.experience_level] ?? o.experience_level : null,
                  `${o.positions_count ?? 1} poste${(o.positions_count ?? 1) > 1 ? 's' : ''}`,
                ]
                  .filter(Boolean)
                  .join(' · ')}
                {o.application_deadline ? ` · candidatures jusqu’au ${new Date(o.application_deadline).toLocaleDateString('fr-FR')}` : ''}
              </p>
              <p className="mt-1 text-label-md text-amud-on-surface-variant">
                {o.applications_count === 0 ? 'Aucune candidature' : `${o.applications_count} candidature${o.applications_count > 1 ? 's' : ''}`}
              </p>
            </div>
            <div className="flex shrink-0 gap-sm">
              <button onClick={() => startEdit(o)} className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                Modifier
              </button>
              <button onClick={() => setDeleting(o)} className="rounded-lg border border-amud-outline-variant px-3 py-1.5 text-label-sm font-medium text-amud-error transition-colors hover:bg-amud-error-container">
                Supprimer
              </button>
            </div>
          </div>
        ))}
      </div>

      <Modal
        open={open}
        onClose={close}
        title={editing ? 'Modifier l’offre' : 'Nouvelle offre'}
        subtitle="Décrivez précisément le poste pour recevoir des candidatures pertinentes."
        widthClassName="max-w-3xl"
        footer={
          <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
            <Button type="button" variant="ghost" onClick={close}>
              Annuler
            </Button>
            <Button
              type="submit"
              form="offer-form"
              disabled={incomplete || save.isPending}
              loading={save.isPending}
              loadingLabel="Enregistrement…"
            >
              {editing ? 'Enregistrer les modifications' : 'Créer l’offre'}
            </Button>
          </div>
        }
      >
        <form
          id="offer-form"
          className="grid gap-6"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <FormSection title="Poste et localisation">
            <TextField
              className="sm:col-span-2"
              label="Intitulé"
              placeholder="Infirmier·ère en soins généraux"
              value={form.title}
              onChange={(e) => setForm({ ...form, title: e.target.value })}
              autoFocus
              required
            />
            <TextField label="Secteur" placeholder="Santé" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} required />
            <SelectField
              label="Contrat"
              value={form.contract_type}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              options={Object.entries(CONTRACTS).map(([value, label]) => ({ value, label }))}
              required
            />
            <TextField label="Ville" placeholder="Berlin" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
            <TextField label="Pays" placeholder="Allemagne" value={form.country} onChange={(e) => setForm({ ...form, country: e.target.value })} required />
            <TextField
              label="Nombre de postes"
              type="number"
              inputMode="numeric"
              min={1}
              max={999}
              value={form.positions_count}
              onChange={(e) => setForm({ ...form, positions_count: e.target.value.replace(/\D/g, '') })}
              required
            />
            <SelectField
              label="Mode de travail"
              value={form.workplace_type}
              onChange={(e) => setForm({ ...form, workplace_type: e.target.value })}
              options={Object.entries(WORKPLACE_TYPES).map(([value, label]) => ({ value, label }))}
              required
            />
          </FormSection>

          <FormSection title="Contenu de l’offre">
            <TextareaField
              className="sm:col-span-2"
              label="Description du poste"
              placeholder="Présentez le poste, l’équipe et le contexte de travail…"
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              required
            />
            <TextareaField
              className="sm:col-span-2"
              label="Missions et responsabilités"
              hint="Une mission par ligne facilite la lecture."
              placeholder={'Assurer les soins quotidiens…\nCollaborer avec l’équipe médicale…'}
              rows={4}
              value={form.responsibilities}
              onChange={(e) => setForm({ ...form, responsibilities: e.target.value })}
              required
            />
            <TextareaField
              className="sm:col-span-2"
              label="Profil et compétences recherchés"
              hint="Précisez les diplômes, compétences techniques et qualités attendues."
              placeholder={'Diplôme reconnu ou en cours de reconnaissance…\nSens du travail en équipe…'}
              rows={4}
              value={form.requirements}
              onChange={(e) => setForm({ ...form, requirements: e.target.value })}
              required
            />
          </FormSection>

          <FormSection title="Profil recherché">
            <SelectField
              label="Expérience"
              value={form.experience_level}
              onChange={(e) => setForm({ ...form, experience_level: e.target.value })}
              placeholder="Non précisée"
              options={Object.entries(EXPERIENCE_LEVELS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Niveau d’études"
              value={form.education_level}
              onChange={(e) => setForm({ ...form, education_level: e.target.value })}
              placeholder="Non précisé"
              options={Object.entries(EDUCATION_LEVELS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Allemand exigé"
              value={form.required_cefr_level}
              onChange={(e) => setForm({ ...form, required_cefr_level: e.target.value })}
              placeholder="Sans exigence"
              options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => ({ value: level, label: level }))}
            />
            <TextField
              label="Temps de travail"
              hint="Heures par semaine"
              type="number"
              inputMode="numeric"
              min={1}
              max={80}
              placeholder="38"
              value={form.weekly_hours}
              onChange={(e) => setForm({ ...form, weekly_hours: e.target.value.replace(/\D/g, '') })}
            />
          </FormSection>

          <FormSection title="Rémunération et avantages">
            <TextField
              label="Salaire minimum"
              hint={`${form.currency} brut par mois`}
              inputMode="numeric"
              placeholder="2400"
              value={form.salary_min}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/\D/g, '') })}
            />
            <TextField
              label="Salaire maximum"
              hint={`${form.currency} brut par mois`}
              error={salaryInvalid ? 'Le salaire maximum doit être supérieur au minimum.' : undefined}
              inputMode="numeric"
              placeholder="3100"
              value={form.salary_max}
              onChange={(e) => setForm({ ...form, salary_max: e.target.value.replace(/\D/g, '') })}
            />
            <SelectField
              label="Devise"
              value={form.currency}
              onChange={(e) => setForm({ ...form, currency: e.target.value })}
              options={CURRENCIES.map((currency) => ({ value: currency, label: currency }))}
            />
            <div aria-hidden="true" className="hidden sm:block" />
            <TextareaField
              className="sm:col-span-2"
              label="Avantages et accompagnement"
              hint="Par exemple : logement temporaire, transport, mutuelle, cours d’allemand."
              placeholder="Aide à l’installation, mutuelle, 30 jours de congés…"
              rows={3}
              value={form.benefits}
              onChange={(e) => setForm({ ...form, benefits: e.target.value })}
            />
          </FormSection>

          <FormSection title="Calendrier et publication">
            <TextField label="Date de prise de poste" type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
            <TextField
              label="Date limite de candidature"
              type="date"
              value={form.application_deadline}
              onChange={(e) => setForm({ ...form, application_deadline: e.target.value })}
            />
            <SelectField
              className="sm:col-span-2"
              label="Statut"
              hint={form.status === 'published' ? 'L’offre sera immédiatement visible par les candidats.' : 'Vous pourrez publier le brouillon plus tard.'}
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              options={Object.entries(STATUSES).map(([value, label]) => ({ value, label }))}
            />
          </FormSection>

          {save.error ? <p className="rounded-lg bg-amud-error-container p-md text-body-md text-amud-on-error-container">{errorMessage(save.error, 'Enregistrement impossible.')}</p> : null}
        </form>
      </Modal>

      <ConfirmDialog
        open={deleting !== null}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && remove.mutate(deleting.id)}
        title="Supprimer l’offre ?"
        description={
          deleting && deleting.applications_count > 0
            ? `${deleting.applications_count} candidature(s) ont été déposée(s) sur cette offre. La fermer plutôt que la supprimer la retire des recherches sans effacer ce qui s’y rattache.`
            : 'Cette action est irréversible.'
        }
        confirmLabel="Supprimer"
      />
    </div>
  );
}
