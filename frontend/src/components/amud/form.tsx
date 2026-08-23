'use client';

import { ReactNode, useRef } from 'react';

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
