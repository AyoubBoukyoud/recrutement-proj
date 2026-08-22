'use client';

/*
 * Le kit d'interface de l'espace ops, écrit avec les tokens partagés de
 * packages/design-tokens : même vert sarcelle, même or, même Inter que
 * l'espace candidat. La densité seule diffère — ces écrans affichent des
 * tableaux là où l'espace candidat affiche des cartes.
 *
 * L'API exportée est inchangée depuis la version CSS : les pages n'ont pas
 * à bouger.
 *
 * `'use client'` depuis l'ajout de `DropdownMenu` (useState/useRef/useEffect)
 * — dès qu'un seul export a besoin de hooks, tout le module doit franchir la
 * frontière client, y compris les composants purement présentationnels
 * (`Card`, `SectionHeader`…) qu'une page serveur comme `admin/[...slug]`
 * importe seule : Next rend alors ce sous-arbre côté client, ce qui reste
 * correct pour un fragment aussi statique.
 */
import {
  Fragment,
  useEffect,
  useRef,
  useState,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'

const cx = (...parts: (string | false | undefined)[]) => parts.filter(Boolean).join(' ')

const BUTTON_BASE =
  'inline-flex items-center justify-center gap-2 rounded-element border border-transparent font-semibold tracking-[0.1px] transition-[background-color,border-color,transform] duration-100 active:enabled:scale-[0.985] disabled:cursor-not-allowed disabled:opacity-60'

const BUTTON_VARIANTS = {
  primary: 'bg-primary text-white hover:enabled:bg-primary-dark disabled:bg-surface-highest disabled:text-outline',
  ghost:
    'border-outline-variant bg-surface-lowest text-on-surface hover:enabled:border-primary hover:enabled:text-primary',
  danger:
    'border-error/40 bg-surface-lowest text-error hover:enabled:border-error hover:enabled:bg-error hover:enabled:text-on-error',
} as const

export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost' | 'danger'
  size?: 'default' | 'compact'
}) {
  return (
    <button
      className={cx(
        BUTTON_BASE,
        BUTTON_VARIANTS[variant],
        size === 'compact' ? 'h-9 px-3 text-[13px]' : 'h-13 px-6 text-[15px]',
        className
      )}
      {...props}
    />
  )
}

const FIELD_INPUT =
  'h-13 w-full rounded-element border border-outline bg-surface-lowest px-3.5 text-[15px] text-on-surface transition-colors placeholder:text-outline focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 aria-[invalid=true]:border-error'

export function Field({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-on-surface-variant">{label}</span>
        {hint && <span className="eyebrow">{hint}</span>}
      </span>
      <input className={FIELD_INPUT} aria-invalid={error ? true : undefined} {...props} />
      {error && <span className="text-[13px] text-error">{error}</span>}
    </label>
  )
}

/** Même enveloppe que Field, pour qu'un menu et un champ s'alignent dans une grille de filtres. */
export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="grid gap-1.5">
      <span className="flex items-baseline justify-between gap-2">
        <span className="text-[13px] font-medium text-on-surface-variant">{label}</span>
      </span>
      <select className={FIELD_INPUT} {...props}>
        {children}
      </select>
    </label>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div
      className="rounded-card border border-outline-variant bg-surface-lowest p-6"
      style={style}
    >
      {children}
    </div>
  )
}

const BADGE_TONES = {
  done: 'bg-primary-light text-primary-dark',
  pending: 'bg-attention-light text-on-attention-container',
  error: 'bg-error-light text-on-error-container',
  /* Un fait, pas une alerte : « via Agent Nord », « vocal », une catégorie —
     l'or de `pending` leur donnait la même urgence qu'un dossier en retard. */
  neutral: 'bg-surface-container text-on-surface-variant',
} as const

export function Badge({
  children,
  tone = 'pending',
}: {
  children: ReactNode
  tone?: keyof typeof BADGE_TONES
}) {
  return (
    <span className={cx('inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold', BADGE_TONES[tone])}>
      {children}
    </span>
  )
}

/** Mono, capitales, espacé — la voix du formulaire plutôt que celle de l'app. */
export function Eyebrow({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' }) {
  return <span className={cx('eyebrow', tone === 'accent' && 'eyebrow-accent')}>{children}</span>
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'pending'; children: ReactNode }) {
  return (
    <div
      className={cx(
        'rounded-element border px-3.5 py-3 text-[13px] leading-5',
        tone === 'error'
          ? 'border-error/25 bg-error-light text-on-error-container'
          : 'border-attention/25 bg-attention-light text-on-attention-container'
      )}
    >
      {children}
    </div>
  )
}

export function SectionHeader({
  eyebrow,
  title,
  subtitle,
}: {
  eyebrow?: string
  title: string
  subtitle?: string
}) {
  return (
    <div className="mb-4 grid gap-1">
      {eyebrow && <Eyebrow tone="accent">{eyebrow}</Eyebrow>}
      <h2 className="subtitle">{title}</h2>
      {subtitle && <p className="helper-text">{subtitle}</p>}
    </div>
  )
}

export function CheckMark({ size = 12 }: { size?: number }) {
  return (
    <span
      className="inline-block rotate-45 border-current"
      style={{
        width: size * 0.48,
        height: size * 0.82,
        marginTop: -size * 0.14,
        borderRightWidth: size < 12 ? 1.6 : 1.8,
        borderBottomWidth: size < 12 ? 1.6 : 1.8,
        borderTopWidth: 0,
        borderLeftWidth: 0,
      }}
    />
  )
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div className="flex items-center gap-2">
      {/* eslint-disable-next-line @next/next/no-img-element -- même logo que
          l'espace candidat (app/(candidate)/layout.tsx), servi depuis public/. */}
      <img src="/assets/images/logo.png" alt="" className="h-6 w-6 object-contain" />
      <div className="grid">
        <span className="text-[17px] font-bold tracking-[-0.3px] text-on-surface">Amud Skills</span>
        {subtitle && <span className="eyebrow">{subtitle}</span>}
      </div>
    </div>
  )
}

const AVATAR_TONES = ['bg-primary text-white', 'bg-secondary text-white', 'bg-tertiary text-white', 'bg-primary-dark text-white']

/** Deux lettres, une teinte stable par nom — pas une photo qu'on n'a pas. */
export function Avatar({ name, size = 36 }: { name: string; size?: number }) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((w) => w[0])
      .join('')
      .toUpperCase() || '?'
  const hash = name.split('').reduce((sum, ch) => sum + ch.charCodeAt(0), 0)
  const tone = AVATAR_TONES[hash % AVATAR_TONES.length]
  return (
    <span
      className={cx('inline-flex shrink-0 items-center justify-center rounded-full font-bold', tone)}
      style={{ width: size, height: size, fontSize: size * 0.38 }}
    >
      {initials}
    </span>
  )
}

/** La complétude d'un dossier, en trait plutôt qu'en seul chiffre. */
export function ProgressBar({ percent, className }: { percent: number; className?: string }) {
  return (
    <div className={cx('h-1.5 w-full overflow-hidden rounded-full bg-surface-container', className)}>
      <div
        className={cx('h-full rounded-full transition-[width]', percent >= 100 ? 'bg-primary' : 'bg-attention')}
        style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
      />
    </div>
  )
}

export function StatusPill({ status, label }: { status: 'ok' | 'error' | 'pending'; label: string }) {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full border border-outline-variant bg-surface-lowest px-2.5 py-1 text-[12px] text-on-surface-variant">
      <span
        className={cx(
          'h-1.5 w-1.5 rounded-full',
          status === 'ok' ? 'bg-primary' : status === 'error' ? 'bg-error' : 'bg-attention'
        )}
      />
      {label}
    </span>
  )
}

/**
 * Le registre de dossier, aligné sur le StepLedger du mobile.
 *
 * Cellules et connecteurs sont des frères à plat, volontairement : la
 * numérotation a du sens ici, la connexion étant réellement une séquence
 * ordonnée de deux étapes, pas une décoration.
 */
export function StepLedger({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <Fragment key={i}>
            <span
              className={cx(
                'flex h-7 w-7 shrink-0 items-center justify-center rounded-full border font-mono text-[11px] tabular-nums',
                i < step
                  ? 'border-primary bg-primary text-white'
                  : i === step
                    ? 'border-primary bg-surface-lowest text-primary'
                    : 'border-outline-variant bg-surface-lowest text-outline'
              )}
            >
              {i < step ? <CheckMark size={12} /> : String(i + 1).padStart(2, '0')}
            </span>
            {i < total - 1 && (
              <span className={cx('h-px flex-1', i < step ? 'bg-primary' : 'bg-outline-variant')} />
            )}
          </Fragment>
        ))}
      </div>
      {label && (
        <Eyebrow>{`Step ${String(step + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')} · ${label}`}</Eyebrow>
      )}
    </div>
  )
}

/**
 * Superposition centrée pour un formulaire court ou une confirmation — le kit
 * n'avait ni Modal ni Drawer avant le module Candidats/Recruteurs. `Drawer`
 * n'existe que dans le kit maquette `/amud` ; celui-ci vit dans les vrais
 * tokens (`surface`, `outline`…) pour rester natif à la console réelle.
 */
export function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean
  onClose: () => void
  title: string
  children: ReactNode
}) {
  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-on-surface/40 p-4" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={title}
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-card border border-outline-variant bg-surface-lowest p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-4 flex items-center justify-between gap-4">
          <h2 className="subtitle">{title}</h2>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="grid h-8 w-8 shrink-0 place-items-center rounded-element text-on-surface-variant hover:bg-surface-container"
          >
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

/**
 * Onglets contrôlés par le parent, sans état interne — pour qu'une page
 * puisse garder l'onglet actif dans l'URL (`?tab=`) si elle le souhaite,
 * comme `CandidatesPanel` le fait déjà pour `status`.
 */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { key: string; label: string }[]
  active: string
  onChange: (key: string) => void
}) {
  return (
    <div className="-mx-6 mb-6 overflow-x-auto border-b border-outline-variant px-6">
      <div className="flex gap-1">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => onChange(tab.key)}
            className={cx(
              'shrink-0 whitespace-nowrap border-b-2 px-3 py-2.5 text-[13px] font-semibold transition-colors',
              active === tab.key
                ? 'border-primary text-primary'
                : 'border-transparent text-on-surface-variant hover:text-on-surface'
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>
    </div>
  )
}

/** Case à cocher de ligne ou d'en-tête (avec état indéterminé pour « tout sélectionner »). */
export function Checkbox({
  checked,
  indeterminate,
  onChange,
  label,
}: {
  checked: boolean
  indeterminate?: boolean
  onChange: (checked: boolean) => void
  label: string
}) {
  return (
    <input
      type="checkbox"
      checked={checked}
      aria-label={label}
      ref={(el) => {
        if (el) el.indeterminate = Boolean(indeterminate)
      }}
      onChange={(e) => onChange(e.target.checked)}
      className="h-4 w-4 shrink-0 cursor-pointer rounded border-outline text-primary focus:ring-2 focus:ring-primary/20"
    />
  )
}

/**
 * Menu d'actions contextuel (⋮) pour une ligne de table. Ferme au clic
 * extérieur ou à Échap ; les actions dangereuses restent la confirmation de
 * l'appelant (même patron inline déjà utilisé dans CandidatesPanel), ce menu
 * ne fait que les marquer visuellement via `tone: 'danger'`.
 */
export function DropdownMenu({
  label = 'Actions',
  items,
}: {
  label?: string
  items: { label: string; onClick: () => void; tone?: 'default' | 'danger'; disabled?: boolean }[]
}) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return

    const onClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }

    document.addEventListener('mousedown', onClickOutside)
    document.addEventListener('keydown', onEscape)
    return () => {
      document.removeEventListener('mousedown', onClickOutside)
      document.removeEventListener('keydown', onEscape)
    }
  }, [open])

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label={label}
        aria-expanded={open}
        className="inline-flex h-8 w-8 items-center justify-center rounded-element border border-outline-variant bg-surface-lowest text-on-surface-variant transition-colors hover:border-primary hover:text-primary"
      >
        ⋮
      </button>
      {open && (
        <div className="absolute right-0 z-40 mt-1 w-56 overflow-hidden rounded-element border border-outline-variant bg-surface-lowest py-1 shadow-lg">
          {items.map((item) => (
            <button
              key={item.label}
              disabled={item.disabled}
              onClick={() => {
                setOpen(false)
                item.onClick()
              }}
              className={cx(
                'block w-full px-3.5 py-2 text-left text-[13px] font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50',
                item.tone === 'danger'
                  ? 'text-error hover:bg-error-light'
                  : 'text-on-surface hover:bg-surface-container'
              )}
            >
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}

/** Barre flottante d'actions groupées, affichée quand des lignes sont sélectionnées. */
export function BulkActionBar({
  count,
  actions,
  onClear,
  noun = 'sélectionné',
}: {
  count: number
  actions: { label: string; onClick: () => void; tone?: 'default' | 'danger'; disabled?: boolean }[]
  onClear: () => void
  noun?: string
}) {
  if (count === 0) return null

  return (
    <div className="sticky bottom-4 z-30 flex flex-wrap items-center gap-3 rounded-element border border-outline-variant bg-surface-lowest px-4 py-3 shadow-lg">
      <span className="text-[13px] font-semibold text-on-surface">
        {count} {noun}
        {count > 1 ? 's' : ''}
      </span>
      <div className="flex flex-wrap gap-2">
        {actions.map((action) => (
          <Button
            key={action.label}
            size="compact"
            variant={action.tone === 'danger' ? 'danger' : 'ghost'}
            disabled={action.disabled}
            onClick={action.onClick}
          >
            {action.label}
          </Button>
        ))}
      </div>
      <button
        onClick={onClear}
        className="ml-auto text-[13px] font-medium text-on-surface-variant hover:text-on-surface"
      >
        Annuler
      </button>
    </div>
  )
}
