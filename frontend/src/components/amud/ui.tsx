'use client';

import Link from 'next/link';
import { ReactNode, useEffect } from 'react';

/**
 * Primitives partagées par le module `/amud` (Admin / Commercial / Employeur
 * / Candidat, portés depuis les maquettes Amud Skills). Isolées ici pour ne
 * pas dupliquer la logique d'interaction (toggle contrôlé, tiroir, nav
 * active) dans chacune des 18 pages.
 */

/* ------------------------------------------------------------------ *
 * Toggle — remplace le pattern statique `<input checked class="peer">`
 * des maquettes par un switch réellement contrôlé.
 * ------------------------------------------------------------------ */
const TOGGLE_SIZES = {
  sm: { track: 'w-9 h-5', dot: 'after:h-4 after:w-4' },
  md: { track: 'w-11 h-6', dot: 'after:h-5 after:w-5' },
  lg: { track: 'w-14 h-7', dot: 'after:h-6 after:w-6' },
} as const;

export function Toggle({
  checked,
  onChange,
  size = 'md',
  label,
  disabled,
}: {
  checked: boolean;
  onChange: (next: boolean) => void;
  size?: keyof typeof TOGGLE_SIZES;
  label?: string;
  disabled?: boolean;
}) {
  const { track, dot } = TOGGLE_SIZES[size];
  return (
    <label className={`relative inline-flex items-center ${disabled ? 'cursor-not-allowed opacity-50' : 'cursor-pointer'}`}>
      <input
        type="checkbox"
        className="peer sr-only"
        checked={checked}
        disabled={disabled}
        onChange={(e) => onChange(e.target.checked)}
        aria-label={label}
      />
      <div
        className={`${track} rounded-full bg-amud-surface-container-highest transition-colors peer-checked:bg-amud-primary-container after:absolute after:left-[2px] after:top-[2px] after:rounded-full after:border after:border-amud-outline-variant after:bg-white after:transition-all after:content-[''] peer-checked:after:translate-x-full peer-checked:after:border-white ${dot} peer-focus-visible:outline peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-amud-primary`}
      />
    </label>
  );
}

/* ------------------------------------------------------------------ *
 * Drawer — panneau latéral (détail de ligne, audit, etc.), remplace les
 * `toggleDrawer()` en JS inline des maquettes.
 * ------------------------------------------------------------------ */
export function Drawer({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClassName = 'max-w-md',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-amud-on-surface/20 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside
        className={`fixed right-0 top-0 z-50 flex h-full w-full ${widthClassName} flex-col border-l border-amud-outline-variant bg-amud-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex shrink-0 items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-lg py-md">
          <div>
            <h3 className="text-title-lg font-semibold text-amud-on-surface">{title}</h3>
            {subtitle ? <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{subtitle}</p> : null}
          </div>
          <button
            className="rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-on-surface"
            onClick={onClose}
            aria-label="Fermer"
          >
            <span className="material-symbols-outlined">close</span>
          </button>
        </div>
        <div className="flex-1 overflow-y-auto p-lg">{children}</div>
        {footer ? <div className="shrink-0 border-t border-amud-outline-variant bg-amud-surface p-md">{footer}</div> : null}
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * NavItem — lien de sidebar avec état actif calculé sur l'URL, comme
 * src/app/admin/layout.tsx le fait déjà pour la console existante.
 * ------------------------------------------------------------------ */
export function isNavActive(pathname: string, href: string, exact = false) {
  if (exact) return pathname === href;
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function NavItem({
  href,
  icon,
  label,
  active,
  badge,
  variant = 'default',
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: string | number;
  variant?: 'default' | 'onDark';
}) {
  const base = 'flex items-center gap-3 rounded-lg px-4 py-2.5 text-label-md font-medium transition-colors';
  const activeCls =
    variant === 'onDark'
      ? 'bg-amud-primary-fixed-dim/90 text-amud-on-primary-fixed'
      : 'bg-amud-primary-container text-white';
  const inactiveCls =
    variant === 'onDark'
      ? 'text-white/80 hover:bg-white/10 hover:text-white'
      : 'text-amud-on-surface-variant hover:bg-amud-surface-container-high hover:text-amud-on-surface';

  return (
    <Link href={href} className={`${base} ${active ? activeCls : inactiveCls}`}>
      <span className="material-symbols-outlined text-[20px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
        {icon}
      </span>
      <span className="flex-1">{label}</span>
      {badge ? (
        <span className="rounded-full bg-amud-secondary px-1.5 py-0.5 text-[10px] font-bold text-amud-on-secondary">{badge}</span>
      ) : null}
    </Link>
  );
}

/* ------------------------------------------------------------------ *
 * InertNavItem — entrées de sidebar reprises des maquettes qui ne
 * pointent vers aucune des 18 pages livrées ici. Gardées visibles (fidèle
 * à l'esprit "implémenter la relation entre les pages") mais désactivées
 * plutôt que de simuler un lien mort.
 * ------------------------------------------------------------------ */
export function InertNavItem({
  icon,
  label,
  variant = 'default',
  badge,
}: {
  icon: string;
  label: string;
  variant?: 'default' | 'onDark';
  badge?: string | number;
}) {
  return (
    <span
      className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-2.5 text-label-md font-medium opacity-50 ${
        variant === 'onDark' ? 'text-white' : 'text-amud-on-surface-variant'
      }`}
      title="Pas encore disponible dans cette maquette"
    >
      <span className="material-symbols-outlined text-[20px]">{icon}</span>
      <span className="flex-1">{label}</span>
      {badge ? <span className="rounded-full bg-amud-secondary px-1.5 py-0.5 text-[10px] font-bold text-amud-on-secondary">{badge}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * Tabs — bandeau d'onglets contrôlé (remplace les liens `href="#"` des
 * maquettes qui ne changent visuellement que le style "actif").
 * ------------------------------------------------------------------ */
export function Tabs({
  tabs,
  active,
  onChange,
}: {
  tabs: { id: string; label: string }[];
  active: string;
  onChange: (id: string) => void;
}) {
  return (
    <div className="flex gap-lg overflow-x-auto border-b border-amud-outline-variant px-sm">
      {tabs.map((t) => (
        <button
          key={t.id}
          onClick={() => onChange(t.id)}
          className={`inline-block whitespace-nowrap border-b-2 py-sm text-label-md font-medium transition-colors ${
            active === t.id
              ? 'border-amud-primary font-bold text-amud-primary'
              : 'border-transparent text-amud-on-surface-variant hover:text-amud-on-surface'
          }`}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
