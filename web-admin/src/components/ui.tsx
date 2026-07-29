import {
  Fragment,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
} from 'react'
import './ui.css'

export function Button({
  variant = 'primary',
  size = 'default',
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: 'primary' | 'ghost'
  size?: 'default' | 'compact'
}) {
  const sizeClass = size === 'compact' ? ' btn-compact' : ''
  return <button className={`btn btn-${variant}${sizeClass} ${className}`} {...props} />
}

export function Field({
  label,
  hint,
  error,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & { label: string; hint?: string; error?: string }) {
  return (
    <label className="field">
      <span className="field-head">
        <span className="field-label">{label}</span>
        {hint && <span className="eyebrow">{hint}</span>}
      </span>
      <input className="field-input" aria-invalid={error ? true : undefined} {...props} />
      {error && <span className="error-text">{error}</span>}
    </label>
  )
}

/** Same shell as Field, so a dropdown and a text input line up in a filter grid. */
export function SelectField({
  label,
  children,
  ...props
}: SelectHTMLAttributes<HTMLSelectElement> & { label: string; children: ReactNode }) {
  return (
    <label className="field">
      <span className="field-head">
        <span className="field-label">{label}</span>
      </span>
      <select className="field-input" {...props}>
        {children}
      </select>
    </label>
  )
}

export function Card({ children, style }: { children: ReactNode; style?: React.CSSProperties }) {
  return (
    <div className="card" style={{ padding: 'var(--sp-lg)', ...style }}>
      {children}
    </div>
  )
}

export function Badge({ children, tone = 'pending' }: { children: ReactNode; tone?: 'pending' | 'done' }) {
  return <span className={tone === 'done' ? 'badge badge-done' : 'badge'}>{children}</span>
}

/** Mono, caps, tracked out — the voice of the form itself rather than the app. */
export function Eyebrow({ children, tone = 'muted' }: { children: ReactNode; tone?: 'muted' | 'accent' }) {
  return <span className={tone === 'accent' ? 'eyebrow eyebrow-accent' : 'eyebrow'}>{children}</span>
}

export function Notice({ tone = 'error', children }: { tone?: 'error' | 'pending'; children: ReactNode }) {
  return <div className={`notice notice-${tone}`}>{children}</div>
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
    <div style={{ display: 'grid', gap: 'var(--sp-xs)', marginBottom: 'var(--sp-md)' }}>
      {eyebrow && <Eyebrow tone="accent">{eyebrow}</Eyebrow>}
      <h2>{title}</h2>
      {subtitle && <p className="helper-text">{subtitle}</p>}
    </div>
  )
}

export function CheckMark({ size = 12 }: { size?: number }) {
  return (
    <span
      className="checkmark"
      style={{
        width: size * 0.48,
        height: size * 0.82,
        marginTop: -size * 0.14,
        borderRightWidth: size < 12 ? 1.6 : 1.8,
        borderBottomWidth: size < 12 ? 1.6 : 1.8,
      }}
    />
  )
}

export function Wordmark({ subtitle }: { subtitle?: string }) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--sp-sm)' }}>
      <span className="seal-dot">
        <CheckMark size={11} />
      </span>
      <div style={{ display: 'grid' }}>
        <span
          style={{
            fontFamily: 'var(--font-display)',
            fontWeight: 600,
            fontSize: 17,
            letterSpacing: '-0.3px',
          }}
        >
          Recruitment Platform
        </span>
        {subtitle && <span className="eyebrow">{subtitle}</span>}
      </div>
    </div>
  )
}

export function StatusPill({ status, label }: { status: 'ok' | 'error' | 'pending'; label: string }) {
  const dotClass = status === 'ok' ? 'is-ok' : status === 'error' ? 'is-error' : ''
  return (
    <span className="status-pill">
      <span className={`status-dot ${dotClass}`} />
      {label}
    </span>
  )
}

/**
 * The dossier ledger, matching mobile's StepLedger.
 *
 * Cells and connectors are flat siblings on purpose, mirroring the mobile
 * implementation — the numbering is meaningful here because signing in really
 * is an ordered two-step sequence, not decoration.
 */
export function StepLedger({ step, total, label }: { step: number; total: number; label?: string }) {
  return (
    <div style={{ display: 'grid', gap: 'var(--sp-sm)' }}>
      <div className="ledger" aria-hidden="true">
        {Array.from({ length: total }).map((_, i) => (
          <Fragment key={i}>
            <span className={`ledger-cell ${i < step ? 'is-done' : i === step ? 'is-current' : ''}`}>
              {i < step ? (
                <span style={{ color: 'var(--card)', display: 'flex' }}>
                  <CheckMark size={12} />
                </span>
              ) : (
                String(i + 1).padStart(2, '0')
              )}
            </span>
            {i < total - 1 && <span className={`ledger-line ${i < step ? 'is-done' : ''}`} />}
          </Fragment>
        ))}
      </div>
      {label && (
        <Eyebrow>{`Step ${String(step + 1).padStart(2, '0')} of ${String(total).padStart(2, '0')} · ${label}`}</Eyebrow>
      )}
    </div>
  )
}
