'use client';

import { ReactNode, useEffect, useRef, useState } from 'react';
import {
  PHONE_COUNTRIES,
  checkPhone,
  formatInternationalPhone,
  formatNationalPhone,
  splitInternationalPhone,
} from '@/lib/phoneNumber';

/**
 * Primitives de formulaire du module `/amud`.
 *
 * Les 14 modals du module Centres (étudiant, enseignant, formation, groupe,
 * paiement, planning, tarif, lead, centre…) répétaient toutes la même chaîne
 * de classes Tailwind sur chaque `<input>` / `<select>` / `<textarea>` —
 * la moindre divergence (padding, focus ring, hauteur) se voyait d'une modal
 * à l'autre. Ces composants figent le style, la cible tactile de 44px, le
 * `label` associé (`htmlFor`) et l'affichage d'erreur pour toutes.
 */

const CONTROL =
  'min-h-[44px] w-full rounded-lg border bg-amud-surface px-3 py-2 text-body-md text-amud-on-surface outline-none transition-colors placeholder:text-amud-on-surface-variant/70 focus:ring-2 focus:ring-amud-primary disabled:cursor-not-allowed disabled:opacity-60';

function controlCls(error?: string) {
  return `${CONTROL} ${error ? 'border-amud-error focus:ring-amud-error' : 'border-amud-outline-variant'}`;
}

let fieldSeq = 0;
function useFieldId(explicit?: string) {
  const ref = useRef<string>();
  if (!ref.current) ref.current = explicit ?? `amud-field-${++fieldSeq}`;
  return ref.current;
}

/* ------------------------------------------------------------------ *
 * Field — label + contrôle + message d'erreur / aide.
 * ------------------------------------------------------------------ */
export function Field({
  label,
  htmlFor,
  required,
  error,
  hint,
  className = '',
  children,
}: {
  label: string;
  htmlFor: string;
  required?: boolean;
  error?: string;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={className}>
      <label htmlFor={htmlFor} className="mb-1 block text-label-md text-amud-on-surface-variant">
        {label}
        {required ? <span className="text-amud-error"> *</span> : null}
      </label>
      {children}
      {error ? (
        <p className="mt-1 flex items-center gap-1 text-label-sm text-amud-error" role="alert">
          <span className="material-symbols-outlined text-[14px]" aria-hidden="true">
            error
          </span>
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-label-sm text-amud-on-surface-variant">{hint}</p>
      ) : null}
    </div>
  );
}

type BaseProps = { label: string; error?: string; hint?: string; className?: string };

export function TextField({
  label,
  error,
  hint,
  className,
  id,
  required,
  ...rest
}: BaseProps & React.InputHTMLAttributes<HTMLInputElement>) {
  const fieldId = useFieldId(id);
  return (
    <Field label={label} htmlFor={fieldId} required={required} error={error} hint={hint} className={className}>
      <input
        id={fieldId}
        required={required}
        aria-invalid={error ? true : undefined}
        className={controlCls(error)}
        {...rest}
      />
    </Field>
  );
}

export function TextareaField({
  label,
  error,
  hint,
  className,
  id,
  required,
  rows = 3,
  ...rest
}: BaseProps & React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const fieldId = useFieldId(id);
  return (
    <Field label={label} htmlFor={fieldId} required={required} error={error} hint={hint} className={className}>
      <textarea id={fieldId} rows={rows} required={required} aria-invalid={error ? true : undefined} className={controlCls(error)} {...rest} />
    </Field>
  );
}

export function SelectField({
  label,
  error,
  hint,
  className,
  id,
  required,
  options,
  placeholder,
  ...rest
}: BaseProps & { options: { value: string; label: string }[]; placeholder?: string } & React.SelectHTMLAttributes<HTMLSelectElement>) {
  const fieldId = useFieldId(id);
  return (
    <Field label={label} htmlFor={fieldId} required={required} error={error} hint={hint} className={className}>
      <select id={fieldId} required={required} aria-invalid={error ? true : undefined} className={controlCls(error)} {...rest}>
        {placeholder ? <option value="">{placeholder}</option> : null}
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
    </Field>
  );
}

/* ------------------------------------------------------------------ *
 * PhotoField — photo d'étudiant / d'enseignant (cahier des charges :
 * "Photo" en premier champ des modals Étudiant et Enseignant). Le fichier
 * est lu en data-URL puis stocké tel quel dans localStorage, comme le reste
 * des données du module — pas d'upload serveur ici.
 * ------------------------------------------------------------------ */
const MAX_PHOTO_BYTES = 400 * 1024;

export function PhotoField({
  label = 'Photo',
  value,
  onChange,
  fallback,
  disabled,
  onError,
}: {
  label?: string;
  value?: string;
  onChange: (next: string | undefined) => void;
  /** Initiales affichées tant qu'aucune photo n'est choisie. */
  fallback: string;
  disabled?: boolean;
  onError?: (message: string) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  function handleFile(file?: File) {
    if (!file) return;
    if (!file.type.startsWith('image/')) {
      onError?.('Le fichier sélectionné n’est pas une image.');
      return;
    }
    if (file.size > MAX_PHOTO_BYTES) {
      onError?.('Image trop lourde (400 Ko maximum).');
      return;
    }
    const reader = new FileReader();
    reader.onload = () => onChange(typeof reader.result === 'string' ? reader.result : undefined);
    reader.readAsDataURL(file);
  }

  return (
    <div className="flex items-center gap-md">
      <span className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-full border border-amud-outline-variant bg-amud-surface-container-high text-title-lg font-semibold text-amud-on-surface-variant">
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={value} alt="" className="h-full w-full object-cover" />
        ) : (
          fallback || '?'
        )}
      </span>
      <div className="flex flex-wrap gap-sm">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          className="sr-only"
          disabled={disabled}
          onChange={(e) => {
            handleFile(e.target.files?.[0]);
            e.target.value = '';
          }}
        />
        <button
          type="button"
          disabled={disabled}
          onClick={() => inputRef.current?.click()}
          className="min-h-[44px] rounded-lg border border-amud-outline-variant px-md text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low disabled:opacity-60"
        >
          {value ? 'Changer la photo' : `Ajouter une ${label.toLowerCase()}`}
        </button>
        {value ? (
          <button
            type="button"
            disabled={disabled}
            onClick={() => onChange(undefined)}
            className="min-h-[44px] rounded-lg px-md text-label-md text-amud-error transition-colors hover:bg-amud-error-container/30"
          >
            Retirer
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * FormGrid / FormSection — mise en page commune des formulaires de modal :
 * une colonne sur mobile (360px), deux à partir de `sm`, un champ long
 * (notes, description) occupant toute la largeur via `className="sm:col-span-2"`.
 * ------------------------------------------------------------------ */
export function FormGrid({ id, onSubmit, children }: { id: string; onSubmit: (e: React.FormEvent) => void; children: ReactNode }) {
  return (
    <form id={id} onSubmit={onSubmit} noValidate className="grid grid-cols-1 gap-md sm:grid-cols-2">
      {children}
    </form>
  );
}

export function FormSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="sm:col-span-2">
      <h4 className="mb-sm border-b border-amud-outline-variant pb-1 text-label-md font-semibold uppercase tracking-wider text-amud-on-surface-variant">{title}</h4>
      <div className="grid grid-cols-1 gap-md sm:grid-cols-2">{children}</div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * PhoneField — indicatif pays + numéro national, validé pendant la saisie.
 *
 * `value` / `onChange` parlent E.164 (« +212632594914 ») : le formulaire
 * parent n'a rien à normaliser. `onChange` reçoit '' tant que le numéro est
 * vide, incomplet ou inutilisable pour recevoir un code WhatsApp — les
 * formulaires qui désactivent « Créer » sur `!phone` restent donc corrects
 * sans autre code.
 *
 * Saisie libre : « 06 32 59 49 14 », « +212 632-594-914 » ou
 * « 00212632594914 » collés donnent le même résultat, et l'indicatif se
 * règle tout seul quand on colle un numéro international.
 * ------------------------------------------------------------------ */
export function PhoneField({
  label,
  value,
  onChange,
  required,
  hint,
  className,
  id,
  autoFocus,
  defaultCountry = '+212',
}: {
  label: string;
  value: string;
  onChange: (e164: string) => void;
  required?: boolean;
  hint?: string;
  className?: string;
  id?: string;
  autoFocus?: boolean;
  defaultCountry?: string;
}) {
  const fieldId = useFieldId(id);
  const initial = value ? splitInternationalPhone(value) : null;
  const [country, setCountry] = useState(initial?.country ?? defaultCountry);
  const [raw, setRaw] = useState(initial?.national ?? '');
  const [touched, setTouched] = useState(false);
  const emitted = useRef(value);

  // Le parent peut remplacer ou vider la valeur (réinitialisation du formulaire).
  useEffect(() => {
    if (value === emitted.current) return;
    emitted.current = value;
    if (value) {
      const split = splitInternationalPhone(value);
      setCountry(split.country);
      setRaw(split.national);
    } else {
      setRaw('');
      setTouched(false);
    }
  }, [value]);

  const check = checkPhone(raw, country);
  const placeholder = PHONE_COUNTRIES.find((c) => c.code === country)?.placeholder ?? '';
  const digitCount = raw.replace(/\D/g, '').length;
  // On n'accuse pas d'erreur pendant qu'on tape : après la sortie du champ, ou
  // dès que la longueur d'un numéro complet est atteinte.
  const showError = !check.empty && !check.valid && (touched || digitCount >= 10);

  const emit = (nextRaw: string, nextCountry: string) => {
    const result = checkPhone(nextRaw, nextCountry);
    emitted.current = result.e164;
    onChange(result.e164);
  };

  const handleInput = (text: string) => {
    // Numéro international collé ou tapé en entier : on règle l'indicatif.
    if (/^(\+|00)/.test(text.trim())) {
      const known = checkPhone(text, country);
      const split = known.e164 ? splitInternationalPhone(known.e164) : null;
      if (split && split.country) {
        setCountry(split.country);
        setRaw(split.national);
        emit(split.national, split.country);
        return;
      }
      if (country !== '') {
        setCountry('');
        setRaw(text);
        emit(text, '');
        return;
      }
    }
    setRaw(text);
    emit(text, country);
  };

  const handleCountry = (next: string) => {
    setCountry(next);
    const converted = next === '' && check.e164 ? check.e164 : raw;
    if (converted !== raw) setRaw(converted);
    emit(converted, next);
  };

  const handleBlur = () => {
    setTouched(true);
    if (check.valid && country) {
      const formatted = formatNationalPhone(raw, country);
      if (formatted !== raw) setRaw(formatted);
    }
  };

  const describedBy = `${fieldId}-status`;

  return (
    <Field label={label} htmlFor={fieldId} required={required} error={showError ? check.message : undefined} className={className}>
      <div
        className={`flex min-h-[44px] w-full items-center rounded-lg border bg-amud-surface transition-colors focus-within:ring-2 ${
          showError ? 'border-amud-error focus-within:ring-amud-error' : 'border-amud-outline-variant focus-within:ring-amud-primary'
        }`}
      >
        <select
          aria-label="Indicatif du pays"
          value={country}
          onChange={(e) => handleCountry(e.target.value)}
          className="h-[42px] shrink-0 cursor-pointer rounded-l-lg border-none bg-transparent py-0 pl-3 pr-1 text-body-md font-semibold text-amud-on-surface outline-none focus:ring-0"
        >
          {PHONE_COUNTRIES.map((c) => (
            <option key={c.code || 'other'} value={c.code}>
              {c.label}
            </option>
          ))}
        </select>
        <span className="h-6 w-px shrink-0 bg-amud-outline-variant" aria-hidden="true" />
        <input
          id={fieldId}
          type="tel"
          inputMode="tel"
          autoComplete="off"
          spellCheck={false}
          autoFocus={autoFocus}
          required={required}
          maxLength={32}
          value={raw}
          placeholder={placeholder}
          aria-invalid={showError ? true : undefined}
          aria-describedby={describedBy}
          onChange={(e) => handleInput(e.target.value)}
          onBlur={handleBlur}
          className="h-[42px] min-w-0 flex-1 rounded-r-lg border-none bg-transparent px-3 py-0 text-body-md text-amud-on-surface outline-none placeholder:text-amud-on-surface-variant/70 focus:ring-0"
        />
        {check.valid ? (
          <span className="material-symbols-outlined mr-3 shrink-0 text-[20px] text-success" aria-hidden="true">
            check_circle
          </span>
        ) : null}
      </div>
      <p id={describedBy} className="mt-1 text-label-sm text-amud-on-surface-variant" aria-live="polite">
        {check.valid ? (
          <>
            Sera enregistré : <strong className="font-semibold text-amud-on-surface">{formatInternationalPhone(check.e164)}</strong> · c&apos;est le numéro qui sert à se connecter.
          </>
        ) : showError ? null : (
          hint ?? 'Collez le numéro tel quel ou saisissez-le : le format est géré automatiquement.'
        )}
      </p>
    </Field>
  );
}
