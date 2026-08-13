/*
 * Le kit d'interface de l'espace ops, écrit avec les tokens partagés de
 * packages/design-tokens : même vert sarcelle, même or, même Inter que
 * l'espace candidat. La densité seule diffère — ces écrans affichent des
 * tableaux là où l'espace candidat affiche des cartes.
 *
 * L'API exportée est inchangée depuis la version CSS : les pages n'ont pas
 * à bouger.
 */
import {
  Fragment,
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
} as const

export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
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

export function Badge({ children, tone = 'pending' }: { children: ReactNode; tone?: 'pending' | 'done' }) {
  return (
    <span
      className={cx(
        'inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[12px] font-semibold',
        tone === 'done'
          ? 'bg-primary-light text-primary-dark'
          : 'bg-attention-light text-on-attention-container'
      )}
    >
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
      <span className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-white">
        <CheckMark size={11} />
      </span>
      <div className="grid">
        <span className="text-[17px] font-bold tracking-[-0.3px] text-on-surface">
          Recruitment Platform
        </span>
        {subtitle && <span className="eyebrow">{subtitle}</span>}
      </div>
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
