'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { isAxiosError } from 'axios';
import { api } from '@/lib/opsApi';
import { TopBar } from '@/components/TopBar';
import { Badge, Button, Card, Field, Modal, Notice, SelectField, TextareaField } from '@/components/ui';
import type { Page, JobOffer } from '@/lib/candidateMarketplace';

/*
 * Mes offres.
 *
 * Le formulaire vivait dans une colonne fixe à gauche : il occupait la moitié
 * de l'écran en permanence, y compris quand on venait seulement relire ses
 * offres, et poussait la liste dans une colonne étroite qui s'étirait en un
 * grand cadre vide dès qu'il y avait moins de trois offres. Il passe en
 * dialogue, la liste prend toute la largeur.
 *
 * Le formulaire expose aussi le salaire et le niveau d'allemand exigé, que
 * l'API acceptait déjà (JobOfferController::validated) sans que rien ne
 * permette de les saisir — sur ce produit, le niveau CECRL est précisément ce
 * sur quoi candidats et postes sont rapprochés.
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

const STATUS_TONE: Record<OwnOffer['status'], 'done' | 'pending' | 'neutral'> = {
  draft: 'neutral',
  published: 'done',
  closed: 'pending',
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

export default function Offers() {
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
    mutationFn: () =>
      editing
        ? api.patch(`/recruiter/offers/${editing}`, payloadFrom(form))
        : api.post('/recruiter/offers', payloadFrom(form)),
    onSuccess: () => {
      close();
      qc.invalidateQueries({ queryKey: ['recruiter-offers'] });
    },
  });

  const remove = useMutation({
    mutationFn: (id: number) => api.delete(`/recruiter/offers/${id}`),
    onSuccess: () => {
      setDeleting(null);
      qc.invalidateQueries({ queryKey: ['recruiter-offers'] });
    },
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
    <div className="min-h-screen bg-surface">
      <TopBar title="Mes offres" />

      <main className="mx-auto grid max-w-4xl gap-5 p-6 pb-24 md:pb-6">
        <header className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold">Mes offres</h1>
            <p className="helper-text mt-0.5">
              {q.isLoading
                ? 'Chargement…'
                : `${offers.length} offre${offers.length > 1 ? 's' : ''} · ${offers.filter((o) => o.status === 'published').length} publiée${offers.filter((o) => o.status === 'published').length > 1 ? 's' : ''}`}
            </p>
          </div>
          <Button onClick={startCreate}>Nouvelle offre</Button>
        </header>

        {q.isError && <Notice>Impossible de charger vos offres. Rechargez la page.</Notice>}

        {!q.isLoading && offers.length === 0 && (
          <Card>
            <div className="grid justify-items-center gap-3 py-8 text-center">
              <p className="font-bold">Aucune offre pour l’instant</p>
              <p className="helper-text max-w-sm">
                Une offre publiée devient visible par les candidats dont le dossier correspond, et
                leur est signalée automatiquement.
              </p>
              <Button onClick={startCreate}>Créer ma première offre</Button>
            </div>
          </Card>
        )}

        <div className="grid gap-3">
          {offers.map((o) => (
            <Card key={o.id}>
              <div className="grid gap-3 sm:grid-cols-[1fr_auto] sm:items-start">
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h2 className="font-bold">{o.title}</h2>
                    <Badge tone={STATUS_TONE[o.status]}>{STATUSES[o.status]}</Badge>
                  </div>
                  <p className="helper-text mt-1">
                    {[o.sector, o.city, CONTRACTS[o.contract_type] ?? o.contract_type]
                      .filter(Boolean)
                      .join(' · ')}
                    {o.required_cefr_level ? ` · allemand ${o.required_cefr_level}` : ''}
                    {o.salary_min || o.salary_max
                      ? ` · ${[o.salary_min, o.salary_max].filter(Boolean).join('–')} ${o.currency ?? ''}`.trimEnd()
                      : ''}
                  </p>
                  <p className="helper-text mt-1">
                    {o.applications_count === 0
                      ? 'Aucune candidature'
                      : `${o.applications_count} candidature${o.applications_count > 1 ? 's' : ''}`}
                  </p>
                </div>
                <div className="flex shrink-0 gap-2">
                  <Button size="compact" variant="ghost" onClick={() => startEdit(o)}>
                    Modifier
                  </Button>
                  <Button size="compact" variant="ghost" onClick={() => setDeleting(o)}>
                    Supprimer
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      </main>

      <Modal open={open} onClose={close} title={editing ? 'Modifier l’offre' : 'Nouvelle offre'}>
        <form
          className="grid gap-4"
          onSubmit={(e) => {
            e.preventDefault();
            save.mutate();
          }}
        >
          <Field
            label="Intitulé"
            placeholder="Infirmier·ère en soins généraux"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            autoFocus
            required
          />
          <TextareaField
            label="Description"
            placeholder="Missions, équipe, conditions, accompagnement à l’installation…"
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            required
          />
          <div className="grid gap-4 sm:grid-cols-2">
            <Field
              label="Secteur"
              placeholder="Santé"
              value={form.sector}
              onChange={(e) => setForm({ ...form, sector: e.target.value })}
              required
            />
            <Field
              label="Ville"
              placeholder="Berlin"
              value={form.city}
              onChange={(e) => setForm({ ...form, city: e.target.value })}
              required
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <SelectField
              label="Contrat"
              value={form.contract_type}
              onChange={(e) => setForm({ ...form, contract_type: e.target.value })}
            >
              {Object.entries(CONTRACTS).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </SelectField>
            <SelectField
              label="Allemand exigé"
              value={form.required_cefr_level}
              onChange={(e) => setForm({ ...form, required_cefr_level: e.target.value })}
            >
              <option value="">Sans exigence</option>
              {['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].map((level) => (
                <option key={level} value={level}>
                  {level}
                </option>
              ))}
            </SelectField>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            {/* Mensuel, pas annuel : JobOfferMatching divise par douze la
                préférence annuelle du candidat avant de la comparer à ce
                montant, et la fiche candidat l'affiche tel quel. Saisir un
                salaire annuel ici le rendrait douze fois trop élevé face à
                chaque candidat ayant exprimé une attente salariale. */}
            <Field
              label="Salaire min."
              hint="€ par mois"
              inputMode="numeric"
              placeholder="2400"
              value={form.salary_min}
              onChange={(e) => setForm({ ...form, salary_min: e.target.value.replace(/\D/g, '') })}
            />
            <Field
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
          >
            {Object.entries(STATUSES).map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
          </SelectField>

          {save.error && <Notice>{errorMessage(save.error, 'Enregistrement impossible.')}</Notice>}

          <div className="flex flex-wrap gap-2">
            <Button type="submit" disabled={incomplete || save.isPending}>
              {save.isPending ? 'Enregistrement…' : editing ? 'Enregistrer' : 'Créer l’offre'}
            </Button>
            <Button type="button" variant="ghost" onClick={close}>
              Annuler
            </Button>
          </div>
        </form>
      </Modal>

      <Modal open={deleting !== null} onClose={() => setDeleting(null)} title="Supprimer l’offre">
        {deleting && (
          <div className="grid gap-4">
            <p className="text-[15px]">
              Supprimer <strong>{deleting.title}</strong> ?
            </p>
            {deleting.applications_count > 0 && (
              <Notice tone="pending">
                {deleting.applications_count} candidature
                {deleting.applications_count > 1 ? 's ont' : ' a'} été déposée
                {deleting.applications_count > 1 ? 's' : ''} sur cette offre. La fermer plutôt que la
                supprimer la retire des recherches sans effacer ce qui s’y rattache.
              </Notice>
            )}
            {remove.error && <Notice>{errorMessage(remove.error, 'Suppression impossible.')}</Notice>}
            <div className="flex flex-wrap gap-2">
              <Button
                variant="danger"
                disabled={remove.isPending}
                onClick={() => remove.mutate(deleting.id)}
              >
                {remove.isPending ? 'Suppression…' : 'Supprimer'}
              </Button>
              <Button variant="ghost" onClick={() => setDeleting(null)}>
                Annuler
              </Button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
