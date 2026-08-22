'use client';

import Link from 'next/link';
import { ReactNode, useEffect, useRef, useState } from 'react';

/**
 * Primitives partagées par le module `/amud` (Admin / Commercial / Employeur
 * / Candidat, portés depuis les maquettes Amud Skills). Isolées ici pour ne
 * pas dupliquer la logique d'interaction (toggle contrôlé, tiroir, nav
 * active) dans chacune des 18 pages.
 */

/* ------------------------------------------------------------------ *
 * useDropdown — ouverture contrôlée + fermeture au clic extérieur et à
 * Échap, pour les menus du header (notifications, réglages, profil) des 4
 * coquilles. Reprend le pattern déjà écrit à la main pour la cloche
 * d'`AdminShell`, généralisé pour ne pas le dupliquer 11 fois de plus.
 * ------------------------------------------------------------------ */
export function useDropdown<T extends HTMLElement = HTMLDivElement>() {
  const [open, setOpen] = useState(false);
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') setOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open]);

  return { open, setOpen, ref };
}

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
  anchor = 'right',
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  subtitle?: string;
  children: ReactNode;
  footer?: ReactNode;
  widthClassName?: string;
  /** 'bottom' rend un vrai bottom-sheet (menu "Plus" mobile de `CompanyShell`) plutôt qu'un panneau latéral. */
  anchor?: 'right' | 'bottom';
}) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  const asideCls =
    anchor === 'bottom'
      ? `fixed inset-x-0 bottom-0 z-50 flex max-h-[85vh] w-full flex-col rounded-t-2xl border-t border-amud-outline-variant bg-amud-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-y-0' : 'translate-y-full'
        }`
      : `fixed right-0 top-0 z-50 flex h-full w-full ${widthClassName} flex-col border-l border-amud-outline-variant bg-amud-surface shadow-2xl transition-transform duration-300 ease-in-out ${
          open ? 'translate-x-0' : 'translate-x-full'
        }`;

  return (
    <>
      <div
        className={`fixed inset-0 z-50 bg-amud-on-surface/20 backdrop-blur-sm transition-opacity ${
          open ? 'opacity-100' : 'pointer-events-none opacity-0'
        }`}
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className={asideCls} role="dialog" aria-modal="true">
        {anchor === 'bottom' ? (
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-amud-outline-variant" aria-hidden="true" />
        ) : null}
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
        <div className="flex-1 overflow-y-auto p-lg" style={anchor === 'bottom' ? { paddingBottom: 'max(24px, env(safe-area-inset-bottom))' } : undefined}>
          {children}
        </div>
        {footer ? <div className="shrink-0 border-t border-amud-outline-variant bg-amud-surface p-md">{footer}</div> : null}
      </aside>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * Modal — dialogue centré (popups d'ajout/création), en complément du
 * `Drawer` ci-dessus qui reste réservé aux panneaux de détail. Contrairement
 * au Drawer, il ne reste pas monté fermé : pas d'animation de sortie, juste
 * une entrée fade+scale à chaque ouverture.
 * ------------------------------------------------------------------ */
export function Modal({
  open,
  onClose,
  title,
  subtitle,
  children,
  footer,
  widthClassName = 'max-w-lg',
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

  if (!open) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-amud-on-surface/40 p-md backdrop-blur-sm animate-amud-fade-in"
      onClick={onClose}
      aria-hidden="true"
    >
      <div
        role="dialog"
        aria-modal="true"
        onClick={(e) => e.stopPropagation()}
        className={`flex w-full ${widthClassName} max-h-[85vh] flex-col overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface shadow-2xl animate-amud-scale-in`}
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
      </div>
    </div>
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
  collapsed = false,
}: {
  href: string;
  icon: string;
  label: string;
  active: boolean;
  badge?: string | number;
  variant?: 'default' | 'onDark';
  /** Rail réduite (icônes seules) — cf. AdminShell. Le libellé reste dans le
   * DOM pour réapparaître au survol du conteneur `group`. */
  collapsed?: boolean;
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
  const labelCls = collapsed ? 'md:hidden md:group-hover:inline' : '';

  return (
    <Link href={href} className={`${base} ${active ? activeCls : inactiveCls}`} title={collapsed ? label : undefined}>
      <span
        className="material-symbols-outlined shrink-0 text-[20px]"
        style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}
      >
        {icon}
      </span>
      <span className={`flex-1 ${labelCls}`}>{label}</span>
      {badge ? (
        <span className={`rounded-full bg-amud-secondary px-1.5 py-0.5 text-[10px] font-bold text-amud-on-secondary ${labelCls}`}>
          {badge}
        </span>
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
  collapsed = false,
}: {
  icon: string;
  label: string;
  variant?: 'default' | 'onDark';
  badge?: string | number;
  collapsed?: boolean;
}) {
  const labelCls = collapsed ? 'md:hidden md:group-hover:inline' : '';
  return (
    <span
      className={`flex cursor-not-allowed items-center gap-3 rounded-lg px-4 py-2.5 text-label-md font-medium opacity-50 ${
        variant === 'onDark' ? 'text-white' : 'text-amud-on-surface-variant'
      }`}
      title="Pas encore disponible dans cette maquette"
    >
      <span className="material-symbols-outlined shrink-0 text-[20px]">{icon}</span>
      <span className={`flex-1 ${labelCls}`}>{label}</span>
      {badge ? <span className={`rounded-full bg-amud-secondary px-1.5 py-0.5 text-[10px] font-bold text-amud-on-secondary ${labelCls}`}>{badge}</span> : null}
    </span>
  );
}

/* ------------------------------------------------------------------ *
 * CountUp — anime un nombre de 0 (ou de sa valeur précédente) jusqu'à
 * `value` à son affichage, pour les cartes KPI qui étaient jusque-là des
 * chiffres figés. Respecte `prefers-reduced-motion`.
 * ------------------------------------------------------------------ */
export function CountUp({ value, durationMs = 900, formatter }: { value: number; durationMs?: number; formatter?: (n: number) => string }) {
  const [display, setDisplay] = useState(0);
  const fromRef = useRef(0);

  useEffect(() => {
    if (typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) {
      setDisplay(value);
      return;
    }
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs);
      const eased = 1 - Math.pow(1 - progress, 3);
      setDisplay(Math.round(from + (value - from) * eased));
      if (progress < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = value;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [value]);

  return <>{formatter ? formatter(display) : display.toLocaleString('fr-FR')}</>;
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

/* ------------------------------------------------------------------ *
 * ConfirmDialog — confirmation avant action destructrice (cahier des
 * charges §24 : "Êtes-vous sûr de vouloir supprimer… Annuler / Confirmer"),
 * partagée par toutes les pages CRUD du module plutôt que réimplémentée à
 * chaque suppression.
 * ------------------------------------------------------------------ */
export function ConfirmDialog({
  open,
  onClose,
  onConfirm,
  title,
  description,
  confirmLabel = 'Confirmer',
  danger = true,
}: {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  danger?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={title}
      widthClassName="max-w-sm"
      footer={
        <div className="flex justify-end gap-sm">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
          >
            Annuler
          </button>
          <button
            type="button"
            onClick={() => {
              onConfirm();
              onClose();
            }}
            className={`rounded-lg px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors ${
              danger ? 'bg-amud-error hover:bg-amud-error/90' : 'bg-amud-primary hover:bg-amud-primary-dark'
            }`}
          >
            {confirmLabel}
          </button>
        </div>
      }
    >
      {description ? <p className="text-body-md text-amud-on-surface-variant">{description}</p> : null}
    </Modal>
  );
}
