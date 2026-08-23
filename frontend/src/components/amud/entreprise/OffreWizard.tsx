'use client';

import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useToast } from '@/components/amud/Toast';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { offresCollection } from '@/lib/amud/localOffres';
import { createOffer } from '@/lib/amud/offerCascades';
import { pushNotification } from '@/lib/amud/storage/notify';
import { logAudit } from '@/lib/amud/storage/audit';
import { isRequired } from '@/lib/amud/validators';
import type { Offre, NiveauEtudes, NiveauExperience, Teletravail, Visibilite } from '@/data/amud/offres';

const CONTRATS = ['CDI', 'CDD', 'Stage', 'Freelance', 'Alternance', 'Intérim'];
const NIVEAUX_ETUDES: NiveauEtudes[] = ['Aucun', 'Bac', 'Bac+2', 'Bac+3', 'Bac+5', 'Doctorat'];
const NIVEAUX_EXPERIENCE: NiveauExperience[] = ['Débutant', '1-3 ans', '3-5 ans', '5-10 ans', '10+ ans'];
const TELETRAVAIL_OPTIONS: Teletravail[] = ['Présentiel', 'Hybride', 'Télétravail complet'];
const VISIBILITE_OPTIONS: Visibilite[] = ['Publique', 'Privée', 'Sur invitation'];

const STEPS = ['Informations', 'Description', 'Profil recherché', 'Conditions', 'Publication'];

type FormState = {
  titre: string;
  departement: string;
  secteur: string;
  ville: string;
  localisation: string;
  contrat: string;
  description: string;
  responsabilites: string;
  missions: string;
  niveauEtudes: NiveauEtudes | '';
  niveauExperience: NiveauExperience | '';
  competences: string;
  langues: string;
  softSkills: string;
  salaireMin: string;
  salaireMax: string;
  avantages: string;
  teletravail: Teletravail | '';
  horaires: string;
  dateExpiration: string;
  visibilite: Visibilite;
};

function toList(raw: string): string[] {
  return raw
    .split(/[,\n]/)
    .map((s) => s.trim())
    .filter(Boolean);
}

function initialStateFrom(offre?: Offre): FormState {
  return {
    titre: offre?.titre ?? '',
    departement: offre?.departement ?? '',
    secteur: offre?.secteur ?? '',
    ville: offre?.ville ?? '',
    localisation: offre?.localisation ?? offre?.ville ?? '',
    contrat: offre?.contrat ?? CONTRATS[0],
    description: offre?.description ?? '',
    responsabilites: (offre?.responsabilites ?? []).join('\n'),
    missions: (offre?.missions ?? []).join('\n'),
    niveauEtudes: offre?.niveauEtudes ?? '',
    niveauExperience: offre?.niveauExperience ?? '',
    competences: (offre?.competences ?? []).join(', '),
    langues: (offre?.langues ?? []).join(', '),
    softSkills: (offre?.softSkills ?? []).join(', '),
    salaireMin: offre?.salaireMin != null ? String(offre.salaireMin) : '',
    salaireMax: offre?.salaireMax != null ? String(offre.salaireMax) : '',
    avantages: (offre?.avantages ?? []).join(', '),
    teletravail: offre?.teletravail ?? '',
    horaires: offre?.horaires ?? '',
    dateExpiration: offre?.dateExpiration ?? '',
    visibilite: offre?.visibilite ?? 'Publique',
  };
}

const inputCls = 'w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary';
const labelCls = 'mb-1 block text-label-md text-amud-on-surface-variant';

export function OffreWizard({ mode, initial }: { mode: 'create' | 'edit'; initial?: Offre }) {
  const router = useRouter();
  const notify = useToast();
  const [step, setStep] = useState(0);
  const [form, setForm] = useState<FormState>(() => initialStateFrom(initial));
  const [errors, setErrors] = useState<Record<string, string>>({});

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  function validateStep(i: number): boolean {
    const next: Record<string, string> = {};
    if (i === 0) {
      if (!isRequired(form.titre)) next.titre = 'Le titre du poste est requis.';
      if (!isRequired(form.ville) && !isRequired(form.localisation)) next.localisation = 'La localisation est requise.';
      if (!isRequired(form.contrat)) next.contrat = 'Le type de contrat est requis.';
    }
    if (i === 1) {
      if (!isRequired(form.description)) next.description = 'La description du poste est requise.';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function goNext() {
    if (!validateStep(step)) return;
    setStep((s) => Math.min(STEPS.length - 1, s + 1));
  }

  function goBack() {
    setStep((s) => Math.max(0, s - 1));
  }

  function buildInput(): Omit<Offre, 'id' | 'candidatures' | 'vues'> {
    return {
      titre: form.titre.trim(),
      entreprise: CURRENT_EMPLOYER.entrepriseNom,
      entrepriseId: CURRENT_EMPLOYER.entrepriseId,
      recruteur: initial?.recruteur ?? CURRENT_EMPLOYER.userNom,
      ville: form.ville.trim() || form.localisation.trim(),
      contrat: form.contrat,
      publication: initial?.publication ?? '-',
      statut: initial?.statut ?? 'Brouillon',
      departement: form.departement.trim() || undefined,
      secteur: form.secteur.trim() || undefined,
      localisation: form.localisation.trim() || form.ville.trim(),
      description: form.description.trim() || undefined,
      responsabilites: toList(form.responsabilites),
      missions: toList(form.missions),
      niveauEtudes: form.niveauEtudes || undefined,
      niveauExperience: form.niveauExperience || undefined,
      competences: toList(form.competences),
      langues: toList(form.langues),
      softSkills: toList(form.softSkills),
      salaireMin: form.salaireMin ? Number(form.salaireMin) : undefined,
      salaireMax: form.salaireMax ? Number(form.salaireMax) : undefined,
      avantages: toList(form.avantages),
      teletravail: form.teletravail || undefined,
      horaires: form.horaires.trim() || undefined,
      dateExpiration: form.dateExpiration || undefined,
      visibilite: form.visibilite,
    };
  }

  function save(statut: 'Brouillon' | 'Publiée') {
    if (!validateStep(0) || !validateStep(1)) {
      setStep(0);
      notify('Merci de compléter les champs obligatoires avant de continuer.', 'error');
      return;
    }
    const input = buildInput();
    const publication = statut === 'Publiée' ? new Date().toLocaleDateString('fr-FR') : input.publication;

    if (mode === 'create') {
      const offre = createOffer({ ...input, statut, publication });
      notify(statut === 'Publiée' ? `Offre « ${offre.titre} » publiée.` : `Offre « ${offre.titre} » enregistrée en brouillon.`);
      router.push(`/amud/entreprise/offres/${offre.id}`);
      return;
    }

    if (initial) {
      const wasPublished = initial.statut === 'Publiée';
      offresCollection.update(initial.id, { ...input, statut, publication });
      logAudit({
        utilisateur: CURRENT_EMPLOYER.userNom,
        role: 'Recruteur',
        action: statut === 'Publiée' && !wasPublished ? 'Offre modifiée et publiée' : 'Offre modifiée',
        actionType: 'update',
        module: 'Offres',
        reference: `${input.titre} (#${initial.id})`,
      });
      if (statut === 'Publiée' && !wasPublished) {
        pushNotification({ scope: 'employer', title: `Votre offre « ${input.titre} » est publiée.`, category: 'Offers', href: `/amud/entreprise/offres/${initial.id}` });
      }
      notify(statut === 'Publiée' ? `Offre « ${input.titre} » publiée.` : `Offre « ${input.titre} » enregistrée.`);
      router.push(`/amud/entreprise/offres/${initial.id}`);
    }
  }

  return (
    <div className="pb-24">
      <h2 className="text-headline-lg text-amud-on-surface">{mode === 'create' ? 'Créer une offre' : 'Modifier l’offre'}</h2>

      <div className="mt-lg mb-lg overflow-x-auto">
        <div className="flex min-w-max items-center gap-2">
          {STEPS.map((label, i) => (
            <div key={label} className="flex items-center gap-2">
              <button
                onClick={() => (i < step ? setStep(i) : undefined)}
                className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-label-sm font-bold transition-colors ${
                  i === step ? 'bg-amud-primary text-white' : i < step ? 'bg-amud-primary-container text-white' : 'bg-amud-surface-container-high text-amud-on-surface-variant'
                }`}
                aria-current={i === step ? 'step' : undefined}
              >
                {i < step ? <span className="material-symbols-outlined text-[16px]">check</span> : i + 1}
              </button>
              <span className={`whitespace-nowrap text-label-sm ${i === step ? 'font-bold text-amud-on-surface' : 'text-amud-on-surface-variant'}`}>{label}</span>
              {i < STEPS.length - 1 ? <span className="mx-1 h-px w-6 bg-amud-outline-variant" /> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg">
        {step === 0 ? (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label className={labelCls}>Titre du poste *</label>
              <input value={form.titre} onChange={(e) => set('titre', e.target.value)} className={inputCls} placeholder="Développeur Fullstack React/Node" type="text" />
              {errors.titre ? <p className="mt-1 text-label-sm text-amud-error">{errors.titre}</p> : null}
            </div>
            <div>
              <label className={labelCls}>Département</label>
              <input value={form.departement} onChange={(e) => set('departement', e.target.value)} className={inputCls} placeholder="Ingénierie" type="text" />
            </div>
            <div>
              <label className={labelCls}>Secteur</label>
              <input value={form.secteur} onChange={(e) => set('secteur', e.target.value)} className={inputCls} placeholder="IT" type="text" />
            </div>
            <div>
              <label className={labelCls}>Ville</label>
              <input value={form.ville} onChange={(e) => set('ville', e.target.value)} className={inputCls} placeholder="Casablanca" type="text" />
            </div>
            <div>
              <label className={labelCls}>Localisation *</label>
              <input value={form.localisation} onChange={(e) => set('localisation', e.target.value)} className={inputCls} placeholder="Casablanca, Maroc" type="text" />
              {errors.localisation ? <p className="mt-1 text-label-sm text-amud-error">{errors.localisation}</p> : null}
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Type de contrat *</label>
              <select value={form.contrat} onChange={(e) => set('contrat', e.target.value)} className={inputCls}>
                {CONTRATS.map((c) => (
                  <option key={c}>{c}</option>
                ))}
              </select>
            </div>
          </div>
        ) : null}

        {step === 1 ? (
          <div className="flex flex-col gap-md">
            <div>
              <label className={labelCls}>Description du poste *</label>
              <textarea value={form.description} onChange={(e) => set('description', e.target.value)} rows={5} className={inputCls} placeholder="Présentez le poste, l’équipe, le contexte…" />
              {errors.description ? <p className="mt-1 text-label-sm text-amud-error">{errors.description}</p> : null}
            </div>
            <div>
              <label className={labelCls}>Responsabilités (une par ligne)</label>
              <textarea value={form.responsabilites} onChange={(e) => set('responsabilites', e.target.value)} rows={4} className={inputCls} placeholder={'Concevoir…\nParticiper…'} />
            </div>
            <div>
              <label className={labelCls}>Missions (une par ligne)</label>
              <textarea value={form.missions} onChange={(e) => set('missions', e.target.value)} rows={4} className={inputCls} placeholder={'Développement…\nTests…'} />
            </div>
          </div>
        ) : null}

        {step === 2 ? (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Niveau d’études</label>
              <select value={form.niveauEtudes} onChange={(e) => set('niveauEtudes', e.target.value as NiveauEtudes)} className={inputCls}>
                <option value="">Non spécifié</option>
                {NIVEAUX_ETUDES.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Expérience</label>
              <select value={form.niveauExperience} onChange={(e) => set('niveauExperience', e.target.value as NiveauExperience)} className={inputCls}>
                <option value="">Non spécifiée</option>
                {NIVEAUX_EXPERIENCE.map((n) => (
                  <option key={n}>{n}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Compétences (séparées par des virgules)</label>
              <input value={form.competences} onChange={(e) => set('competences', e.target.value)} className={inputCls} placeholder="React, Node.js, TypeScript" type="text" />
            </div>
            <div>
              <label className={labelCls}>Langues (séparées par des virgules)</label>
              <input value={form.langues} onChange={(e) => set('langues', e.target.value)} className={inputCls} placeholder="Français, Anglais" type="text" />
            </div>
            <div>
              <label className={labelCls}>Soft skills (séparés par des virgules)</label>
              <input value={form.softSkills} onChange={(e) => set('softSkills', e.target.value)} className={inputCls} placeholder="Autonomie, Communication" type="text" />
            </div>
          </div>
        ) : null}

        {step === 3 ? (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Salaire minimum (MAD)</label>
              <input value={form.salaireMin} onChange={(e) => set('salaireMin', e.target.value)} className={inputCls} placeholder="12000" type="number" min={0} />
            </div>
            <div>
              <label className={labelCls}>Salaire maximum (MAD)</label>
              <input value={form.salaireMax} onChange={(e) => set('salaireMax', e.target.value)} className={inputCls} placeholder="18000" type="number" min={0} />
            </div>
            <div className="sm:col-span-2">
              <label className={labelCls}>Avantages (séparés par des virgules)</label>
              <input value={form.avantages} onChange={(e) => set('avantages', e.target.value)} className={inputCls} placeholder="Mutuelle, Tickets restaurant" type="text" />
            </div>
            <div>
              <label className={labelCls}>Télétravail</label>
              <select value={form.teletravail} onChange={(e) => set('teletravail', e.target.value as Teletravail)} className={inputCls}>
                <option value="">Non spécifié</option>
                {TELETRAVAIL_OPTIONS.map((t) => (
                  <option key={t}>{t}</option>
                ))}
              </select>
            </div>
            <div>
              <label className={labelCls}>Horaires</label>
              <input value={form.horaires} onChange={(e) => set('horaires', e.target.value)} className={inputCls} placeholder="9h-18h, du lundi au vendredi" type="text" />
            </div>
          </div>
        ) : null}

        {step === 4 ? (
          <div className="grid grid-cols-1 gap-md sm:grid-cols-2">
            <div>
              <label className={labelCls}>Date d’expiration</label>
              <input value={form.dateExpiration} onChange={(e) => set('dateExpiration', e.target.value)} className={inputCls} type="date" />
            </div>
            <div>
              <label className={labelCls}>Visibilité</label>
              <select value={form.visibilite} onChange={(e) => set('visibilite', e.target.value as Visibilite)} className={inputCls}>
                {VISIBILITE_OPTIONS.map((v) => (
                  <option key={v}>{v}</option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 rounded-lg border border-amud-outline-variant bg-amud-surface p-md text-label-sm text-amud-on-surface-variant">
              <p>
                <strong className="text-amud-on-surface">{form.titre || 'Titre du poste'}</strong> · {form.localisation || form.ville || 'Localisation'} · {form.contrat}
              </p>
              <p className="mt-1">Vérifiez les informations ci-dessus avant de publier, ou enregistrez en brouillon pour continuer plus tard.</p>
            </div>
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-16 z-20 border-t border-amud-outline-variant bg-amud-surface p-md shadow-[0_-4px_12px_rgba(0,0,0,0.05)] md:sticky md:bottom-0 md:ml-0">
        <div className="mx-auto flex max-w-3xl items-center justify-between gap-sm">
          <button
            onClick={goBack}
            disabled={step === 0}
            className="rounded-lg border border-amud-outline-variant px-lg py-2.5 text-label-md font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low disabled:cursor-not-allowed disabled:opacity-40"
          >
            Retour
          </button>
          <div className="flex items-center gap-sm">
            <button onClick={() => save('Brouillon')} className="rounded-lg border border-amud-outline-variant px-lg py-2.5 text-label-md font-medium text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
              Enregistrer brouillon
            </button>
            {step < STEPS.length - 1 ? (
              <button onClick={goNext} className="rounded-lg bg-amud-primary px-lg py-2.5 text-label-md font-medium text-white shadow-sm transition-colors hover:brightness-110">
                Suivant
              </button>
            ) : (
              <button onClick={() => save('Publiée')} className="rounded-lg bg-amud-primary px-lg py-2.5 text-label-md font-medium text-white shadow-sm transition-colors hover:brightness-110">
                Publier
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
