'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { ConfirmDialog, Modal, PageHeader } from '@/components/amud/ui';
import { SelectField, TextareaField, TextField } from '@/components/amud/form';
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
  sector: string;
  city: string;
  country: string;
  contract_type: string;
  required_cefr_level: string;
  salary_min: string;
  salary_max: string;
  status: string;
};

const EMPTY: OfferForm = {
  title: '',
  description: '',
  sector: '',
  city: '',
  country: 'Germany',
  contract_type: 'permanent',
  required_cefr_level: '',
  salary_min: '',
  salary_max: '',
  status: 'draft',
};

const CONTRACTS: Record<string, string> = {
  permanent: 'CDI',
  fixed_term: 'CDD',
  apprenticeship: 'Apprentissage',
  temporary: 'Intérim',
  internship: 'Stage',
};

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

/** Les champs numériques partent en null plutôt qu'en chaîne vide : `nullable|integer`. */
function payloadFrom(form: OfferForm) {
  return {
    ...form,
    required_cefr_level: form.required_cefr_level || null,
    salary_min: form.salary_min ? Number(form.salary_min) : null,
    salary_max: form.salary_max ? Number(form.salary_max) : null,
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
      sector: o.sector,
      city: o.city,
      country: o.country,
      contract_type: o.contract_type,
      required_cefr_level: o.required_cefr_level ?? '',
      salary_min: o.salary_min != null ? String(o.salary_min) : '',
      salary_max: o.salary_max != null ? String(o.salary_max) : '',
      status: o.status,
    });
    save.reset();
    setOpen(true);
  };

  const offers = q.data?.data ?? [];
  const incomplete = !form.title || !form.description || !form.sector || !form.city;

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

      <Modal open={open} onClose={close} title={editing ? 'Modifier l’offre' : 'Nouvelle offre'}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <TextField label="Intitulé" placeholder="Infirmier·ère en soins généraux" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} autoFocus required />
          <TextareaField
            label="Description"
            placeholder="Missions, équipe, conditions, accompagnement à l’installation…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <TextField label="Secteur" placeholder="Santé" value={form.sector} onChange={(e) => setForm({ ...form, sector: e.target.value })} required />
            <TextField label="Ville" placeholder="Berlin" value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })} required />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Contrat"
              value={form.contract_type}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
              options={Object.entries(CONTRACTS).map(([value, label]) => ({ value, label }))}
            />
            <SelectField
              label="Allemand exigé"
              value={form.required_cefr_level}
              onChange={(e) => setForm({ ...form, required_cefr_level: e.target.value })}
              placeholder="Sans exigence"
              options={['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => ({ value: level, label: level }))}
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mensuel, pas annuel : JobOfferMatching divise par douze la
                préférence annuelle du candidat avant de la comparer à ce
                montant. */}
            <TextField
              label="Salaire min."
              hint="€ par mois"
              inputMode="numeric"
              placeholder="2400"
              value={form.salary_min}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/\D/g, '') })}
            />
            <TextField
              label="Salaire max."
              hint="€ par mois"
              inputMode="numeric"
              placeholder="3100"
              value={form.salary_max}
              onChange={(e) => setForm({ ...form, salary_max: e.target.value.replace(/\D/g, '') })}
            />
          </div>
          <SelectField
            label="Statut"
            hint={form.status === 'published' ? 'visible par les candidats' : undefined}
            value={form.status}
            onChange={(e) => setForm({ ...form, status: e.target.value })}
            options={Object.entries(STATUSES).map(([value, label]) => ({ value, label }))}
          />

          {save.error ? <p className="rounded-lg bg-amud-error-container p-md text-body-md text-amud-on-error-container">{errorMessage(save.error, 'Enregistrement impossible.')}</p> : null}

          <div className="flex flex-wrap gap-sm">
            <Button type="submit" disabled={incomplete || save.isPending} loading={save.isPending} loadingLabel="Enregistrement…">
              {editing ? 'Enregistrer' : 'Créer l’offre'}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Annuler
            </Button>
          </div>
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
