'use client';

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { FormEvent, useState } from 'react';
import { Button } from '@/components/amud/ui';
import { useToast } from '@/components/amud/Toast';
import { signupCandidate } from '@/lib/amud/candidateAuthCascades';

type FormState = { prenom: string; nom: string; email: string; telephone: string; password: string };
const EMPTY: FormState = { prenom: '', nom: '', email: '', telephone: '', password: '' };

function validate(form: FormState): Partial<Record<keyof FormState, string>> {
  const errors: Partial<Record<keyof FormState, string>> = {};
  if (!form.prenom.trim()) errors.prenom = 'Prénom requis.';
  if (!form.nom.trim()) errors.nom = 'Nom requis.';
  if (!/^\S+@\S+\.\S+$/.test(form.email)) errors.email = 'Email invalide.';
  if (!/^[\d+()\s.-]{8,}$/.test(form.telephone)) errors.telephone = 'Numéro de téléphone invalide.';
  if (form.password.length < 6) errors.password = 'Au moins 6 caractères.';
  return errors;
}

export default function InscriptionPage() {
  const router = useRouter();
  const notify = useToast();
  const [form, setForm] = useState<FormState>(EMPTY);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});
  const [submitting, setSubmitting] = useState(false);

  function set<K extends keyof FormState>(key: K, value: FormState[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  function onSubmit(e: FormEvent) {
    e.preventDefault();
    const nextErrors = validate(form);
    setErrors(nextErrors);
    if (Object.keys(nextErrors).length > 0) return;

    setSubmitting(true);
    const result = signupCandidate(form);
    setSubmitting(false);
    if (!result.account) {
      notify(result.error ?? 'Une erreur est survenue.', 'error');
      return;
    }
    notify(`Bienvenue, ${result.account.prenom} !`, 'success');
    router.push('/amud/candidat/onboarding');
  }

  return (
    <div className="mx-auto flex min-h-[80vh] max-w-md flex-col justify-center px-margin-mobile py-xl">
      <Link href="/amud/candidat" className="mb-lg inline-flex items-center gap-1 text-label-md font-medium text-amud-primary">
        <span className="material-symbols-outlined text-[18px]">arrow_back</span>
        Retour
      </Link>

      <h1 className="text-headline-md text-amud-on-surface">Créer mon compte</h1>
      <p className="mt-1 text-body-md text-amud-on-surface-variant">
        Quelques informations pour démarrer — le reste de votre profil se complètera à votre rythme.
      </p>

      <form id="inscription-form" onSubmit={onSubmit} className="mt-lg flex flex-col gap-md" noValidate>
        <div className="grid grid-cols-2 gap-md">
          <Field label="Prénom" error={errors.prenom}>
            <input
              value={form.prenom}
              onChange={(e) => set('prenom', e.target.value)}
              className={inputClass(Boolean(errors.prenom))}
              autoComplete="given-name"
            />
          </Field>
          <Field label="Nom" error={errors.nom}>
            <input value={form.nom} onChange={(e) => set('nom', e.target.value)} className={inputClass(Boolean(errors.nom))} autoComplete="family-name" />
          </Field>
        </div>
        <Field label="Email" error={errors.email}>
          <input type="email" value={form.email} onChange={(e) => set('email', e.target.value)} className={inputClass(Boolean(errors.email))} autoComplete="email" />
        </Field>
        <Field label="Téléphone" error={errors.telephone}>
          <input type="tel" value={form.telephone} onChange={(e) => set('telephone', e.target.value)} className={inputClass(Boolean(errors.telephone))} autoComplete="tel" placeholder="+212 6 00 00 00 00" />
        </Field>
        <Field label="Mot de passe" error={errors.password}>
          <input type="password" value={form.password} onChange={(e) => set('password', e.target.value)} className={inputClass(Boolean(errors.password))} autoComplete="new-password" />
        </Field>

        <Button type="submit" fullWidth loading={submitting} loadingLabel="Création…" className="mt-sm">
          Créer mon compte
        </Button>
      </form>

      <p className="mt-lg text-center text-label-sm text-amud-on-surface-variant">
        Déjà un compte ?{' '}
        <Link href="/amud/candidat" className="font-medium text-amud-primary hover:underline">
          Retour à l&apos;accueil
        </Link>
      </p>
    </div>
  );
}

function inputClass(hasError: boolean) {
  return `min-h-[44px] w-full rounded-lg border bg-amud-surface px-4 py-2 text-body-md text-amud-on-surface outline-none focus:ring-2 focus:ring-amud-primary ${
    hasError ? 'border-amud-error' : 'border-amud-outline-variant focus:border-transparent'
  }`;
}

function Field({ label, error, children }: { label: string; error?: string; children: React.ReactNode }) {
  return (
    <label className="flex flex-col gap-1">
      <span className="text-label-sm font-medium text-amud-on-surface-variant">{label}</span>
      {children}
      {error ? <span className="text-label-sm text-amud-error">{error}</span> : null}
    </label>
  );
}
