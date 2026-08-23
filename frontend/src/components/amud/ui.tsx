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
  useBodyScrollLock(open);

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
 * useBodyScrollLock — empêche la page de défiler derrière une surface
 * modale (Modal, Drawer, bottom-sheet). Sans ça, sur mobile, le scroll du
 * formulaire "traverse" jusqu'à la liste en arrière-plan.
 * ------------------------------------------------------------------ */
export function useBodyScrollLock(active: boolean) {
  useEffect(() => {
    if (!active) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = previous;
    };
  }, [active]);
}

/* ------------------------------------------------------------------ *
 * useFocusTrap — piège le focus clavier dans la surface modale ouverte et
 * le rend à l'élément déclencheur à la fermeture (accessibilité : §
 * "Navigation clavier" / "Focus" du cahier des charges UI).
 * ------------------------------------------------------------------ */
const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function useFocusTrap<T extends HTMLElement>(active: boolean) {
  const ref = useRef<T>(null);

  useEffect(() => {
    if (!active) return;
    const opener = document.activeElement as HTMLElement | null;
    const node = ref.current;
    if (node) {
      const first = node.querySelector<HTMLElement>(FOCUSABLE);
      // `autoFocus` des formulaires reste prioritaire : on ne force le focus
      // que si rien dans la surface ne l'a déjà pris.
      if (!node.contains(document.activeElement)) (first ?? node).focus();
    }

    function onKeyDown(e: KeyboardEvent) {
      if (e.key !== 'Tab' || !ref.current) return;
      const items = Array.from(ref.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
      if (items.length === 0) return;
      const first = items[0];
      const last = items[items.length - 1];
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault();
        last.focus();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault();
        first.focus();
      }
    }

    document.addEventListener('keydown', onKeyDown);
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      opener?.focus?.();
    };
  }, [active]);

  return ref;
}

/* ------------------------------------------------------------------ *
 * Modal — dialogue d'ajout/édition, **responsive** : bottom-sheet plein
 * largeur sur mobile (360-430px, poignée de glissement, actions collées en
 * bas, safe-area iOS) et dialogue centré sur desktop. Le `Drawer` ci-dessus
 * reste réservé aux panneaux de détail et aux filtres.
 *
 * Un seul composant pour les deux formats : les 14 modals du module
 * (étudiant, enseignant, formation, groupe, paiement, planning, tarif,
 * lead, centre…) héritent donc automatiquement du comportement mobile sans
 * que chacune ait à le réimplémenter.
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
  const panelRef = useFocusTrap<HTMLDivElement>(open);
  useBodyScrollLock(open);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [open, onClose]);

  if (!open) return null;

  return (
    <>
      <div className="fixed inset-0 z-50 bg-amud-on-surface/40 backdrop-blur-sm animate-amud-fade-in" onClick={onClose} aria-hidden="true" />
      <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-start sm:p-md sm:pt-[6vh]" onClick={onClose}>
        <div
          ref={panelRef}
          role="dialog"
          aria-modal="true"
          aria-label={title}
          onClick={(e) => e.stopPropagation()}
          className={`flex w-full ${widthClassName} max-h-[92vh] flex-col overflow-hidden rounded-t-2xl border border-amud-outline-variant bg-amud-surface shadow-2xl animate-amud-sheet-up sm:max-h-[85vh] sm:rounded-xl sm:animate-amud-scale-in`}
        >
          <div className="mx-auto mt-2 h-1.5 w-10 shrink-0 rounded-full bg-amud-outline-variant sm:hidden" aria-hidden="true" />
          <div className="flex shrink-0 items-center justify-between gap-sm border-b border-amud-outline-variant bg-amud-surface-container-low px-lg py-md">
            <div className="min-w-0">
              <h3 className="truncate text-title-lg font-semibold text-amud-on-surface">{title}</h3>
              {subtitle ? <p className="mt-0.5 text-label-sm text-amud-on-surface-variant">{subtitle}</p> : null}
            </div>
            <button
              className="-mr-2 flex h-11 w-11 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-on-surface focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
              onClick={onClose}
              aria-label="Fermer"
            >
              <span className="material-symbols-outlined">close</span>
            </button>
          </div>
          <div className="flex-1 overflow-y-auto overscroll-contain p-lg">{children}</div>
          {footer ? (
            <div
              className="shrink-0 border-t border-amud-outline-variant bg-amud-surface p-md"
              style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}
            >
              {footer}
            </div>
          ) : null}
        </div>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * ModalActions — pied de modal standard (Annuler / action principale).
 * Sur mobile les deux boutons prennent toute la largeur et respectent la
 * cible tactile de 44px ; sur desktop ils reviennent alignés à droite.
 * ------------------------------------------------------------------ */
export function ModalActions({
  onCancel,
  submitLabel,
  form,
  onSubmit,
  danger = false,
  cancelLabel = 'Annuler',
  disabled = false,
}: {
  onCancel: () => void;
  submitLabel: string;
  /** id du <form> à soumettre (pattern déjà utilisé par les modals du module). */
  form?: string;
  onSubmit?: () => void;
  danger?: boolean;
  cancelLabel?: string;
  disabled?: boolean;
}) {
  return (
    <div className="flex flex-col-reverse gap-sm sm:flex-row sm:justify-end">
      <button
        type="button"
        onClick={onCancel}
        className="min-h-[44px] rounded-lg border border-amud-outline-variant px-lg py-2 text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
      >
        {cancelLabel}
      </button>
      <button
        type={form ? 'submit' : 'button'}
        form={form}
        onClick={onSubmit}
        disabled={disabled}
        className={`min-h-[44px] rounded-lg px-lg py-2 text-label-md font-medium text-white shadow-sm transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary disabled:cursor-not-allowed disabled:opacity-60 ${
          danger ? 'bg-amud-error hover:bg-amud-error/90' : 'bg-amud-primary hover:bg-amud-primary-dark'
        }`}
      >
        {submitLabel}
      </button>
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
        <ModalActions
          onCancel={onClose}
          submitLabel={confirmLabel}
          danger={danger}
          onSubmit={() => {
            onConfirm();
            onClose();
          }}
        />
      }
    >
      {description ? <p className="text-body-md text-amud-on-surface-variant">{description}</p> : null}
    </Modal>
  );
}

/* ------------------------------------------------------------------ *
 * EmptyState — état vide unifié ("Aucun centre trouvé", "Aucun étudiant",
 * "Aucune activité"…). Remplace les `<p>Aucun …</p>` que chaque page
 * écrivait à sa façon, pour que les 4 espaces (Admin / Commercial / Centre
 * / Site) affichent exactement la même chose quand il n'y a rien.
 * ------------------------------------------------------------------ */
export function EmptyState({
  icon = 'inbox',
  title,
  description,
  actionLabel,
  onAction,
  compact = false,
}: {
  icon?: string;
  title: string;
  description?: string;
  actionLabel?: string;
  onAction?: () => void;
  compact?: boolean;
}) {
  return (
    <div className={`flex flex-col items-center justify-center text-center ${compact ? 'px-md py-lg' : 'px-lg py-xl'}`}>
      <span className="mb-md flex h-14 w-14 items-center justify-center rounded-full bg-amud-surface-container-high text-amud-on-surface-variant">
        <span className="material-symbols-outlined text-[26px]">{icon}</span>
      </span>
      <p className="text-title-lg text-amud-on-surface">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-body-md text-amud-on-surface-variant">{description}</p> : null}
      {actionLabel && onAction ? (
        <button
          type="button"
          onClick={onAction}
          className="mt-md inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
        >
          <span className="material-symbols-outlined text-[18px]">add</span>
          {actionLabel}
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * LoadingState / ErrorState — pendants de `EmptyState` pour les deux
 * autres états d'écran demandés (chargement, erreur), déjà rendus à la main
 * et différemment par plusieurs pages (`Chargement du centre…`).
 * ------------------------------------------------------------------ */
export function LoadingState({ label = 'Chargement…', rows = 3 }: { label?: string; rows?: number }) {
  return (
    <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-lg shadow-sm" role="status" aria-live="polite">
      <p className="sr-only">{label}</p>
      <div className="flex flex-col gap-md">
        {Array.from({ length: rows }).map((_, i) => (
          <div key={i} className="flex items-center gap-md">
            <div className="h-10 w-10 shrink-0 animate-pulse rounded-full bg-amud-surface-container-high" />
            <div className="flex-1 space-y-2">
              <div className="h-3 w-1/3 animate-pulse rounded bg-amud-surface-container-high" />
              <div className="h-3 w-2/3 animate-pulse rounded bg-amud-surface-container-high" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export function ErrorState({ title = 'Une erreur est survenue', description, onRetry }: { title?: string; description?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-xl border border-amud-error/30 bg-amud-error-container px-lg py-xl text-center" role="alert">
      <span className="mb-md flex h-14 w-14 items-center justify-center rounded-full bg-amud-error/10 text-amud-error">
        <span className="material-symbols-outlined text-[26px]">error</span>
      </span>
      <p className="text-title-lg text-amud-on-error-container">{title}</p>
      {description ? <p className="mt-1 max-w-sm text-body-md text-amud-on-error-container/80">{description}</p> : null}
      {onRetry ? (
        <button type="button" onClick={onRetry} className="mt-md min-h-[44px] rounded-lg border border-amud-error/40 px-lg text-label-md font-medium text-amud-on-error-container hover:bg-amud-error/10">
          Réessayer
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * Badge — pastille de statut. Les couleurs de partenariat gardent leurs
 * classes dédiées (`PARTNERSHIP_CLASS`) ; ce composant sert aux statuts
 * "métier" (Actif, En attente, Payé, Impayé…) qui étaient jusqu'ici rendus
 * en texte brut dans les tables.
 * ------------------------------------------------------------------ */
export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

const BADGE_TONES: Record<BadgeTone, string> = {
  neutral: 'bg-amud-surface-container-high text-amud-on-surface-variant border-amud-outline-variant',
  success: 'bg-amud-primary/10 text-amud-primary border-amud-primary/20',
  warning: 'bg-amud-tertiary-fixed text-amud-on-tertiary-fixed-variant border-amud-tertiary-fixed-dim',
  danger: 'bg-amud-error-container text-amud-on-error-container border-amud-error/20',
  info: 'bg-amud-secondary/10 text-amud-secondary border-amud-secondary/30',
};

export function Badge({ children, tone = 'neutral', className = '' }: { children: ReactNode; tone?: BadgeTone; className?: string }) {
  return (
    <span className={`inline-flex w-fit items-center whitespace-nowrap rounded-full border px-2.5 py-0.5 text-xs font-medium ${BADGE_TONES[tone]} ${className}`}>
      {children}
    </span>
  );
}

/** Tons partagés pour les statuts récurrents du module Centres. */
export function statusTone(statut: string): BadgeTone {
  const s = statut.toLowerCase();
  if (['actif', 'active', 'payé', 'paye', 'complet', 'terminé', 'termine', 'présent', 'present', 'inscrit', 'confirmé', 'confirme', 'diplômé', 'diplome'].includes(s)) return 'success';
  if (['en attente', 'partiel', 'planifié', 'planifie', 'nouveau', 'en cours', 'contacté', 'contacte', 'retard'].includes(s)) return 'warning';
  if (['impayé', 'impaye', 'suspendu', 'annulé', 'annule', 'absent', 'perdu', 'expiré', 'expire'].includes(s)) return 'danger';
  if (['inactif', 'archivé', 'archive', 'brouillon'].includes(s)) return 'neutral';
  return 'info';
}

/* ------------------------------------------------------------------ *
 * SearchInput — champ de recherche unique du module. Reprend exactement le
 * markup déjà utilisé par `/amud/admin/centres` et `/amud/commercial/centres`
 * (icône à gauche, focus ring vert) pour ne pas avoir deux recherches d'aspect
 * différent selon la page.
 * ------------------------------------------------------------------ */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Rechercher…',
  label,
}: {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative w-full flex-1">
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant" aria-hidden="true">
        search
      </span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        type="search"
        aria-label={label ?? placeholder}
        placeholder={placeholder}
        className="min-h-[44px] w-full rounded-lg border border-amud-outline-variant bg-amud-surface py-2 pl-10 pr-10 text-body-md text-amud-on-surface outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
      />
      {value ? (
        <button
          type="button"
          onClick={() => onChange('')}
          aria-label="Effacer la recherche"
          className="absolute right-1 top-1/2 flex h-9 w-9 -translate-y-1/2 items-center justify-center rounded-full text-amud-on-surface-variant hover:bg-amud-surface-container-high"
        >
          <span className="material-symbols-outlined text-[18px]">close</span>
        </button>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * SelectFilter — un `<select>` de filtre, même hauteur tactile partout.
 * ------------------------------------------------------------------ */
export function SelectFilter({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (next: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      aria-label={label}
      className="min-h-[44px] w-full shrink-0 rounded-lg border border-amud-outline-variant bg-amud-surface px-4 py-2 text-label-md text-amud-on-surface focus:outline-none focus:ring-2 focus:ring-amud-primary md:w-auto"
    >
      <option value="">{label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/* ------------------------------------------------------------------ *
 * FilterBar — barre "recherche + filtres" : filtres en ligne sur desktop,
 * repliés dans un bottom-sheet sur mobile (pattern déjà éprouvé sur
 * `/amud/admin/centres`, généralisé ici pour toutes les listes du module).
 * ------------------------------------------------------------------ */
export function FilterBar({
  search,
  onSearchChange,
  searchPlaceholder,
  filters,
  activeFilterCount = 0,
  onReset,
  trailing,
}: {
  search: string;
  onSearchChange: (next: string) => void;
  searchPlaceholder?: string;
  filters?: ReactNode;
  activeFilterCount?: number;
  onReset?: () => void;
  trailing?: ReactNode;
}) {
  const [sheetOpen, setSheetOpen] = useState(false);

  return (
    <>
      <div className="mb-lg flex flex-col items-center gap-md rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm md:flex-row">
        <SearchInput value={search} onChange={onSearchChange} placeholder={searchPlaceholder ?? 'Rechercher…'} />
        {filters ? (
          <button
            type="button"
            onClick={() => setSheetOpen(true)}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-4 text-label-md text-amud-on-surface md:hidden"
          >
            <span className="material-symbols-outlined text-[18px]">filter_list</span>
            Filtres
            {activeFilterCount > 0 ? (
              <span className="rounded-full bg-amud-primary px-1.5 text-[11px] font-bold text-white">{activeFilterCount}</span>
            ) : null}
          </button>
        ) : null}
        {filters ? <div className="hidden w-full items-center gap-sm overflow-x-auto md:flex md:w-auto">{filters}</div> : null}
        {trailing ? <div className="hidden md:block">{trailing}</div> : null}
      </div>

      {filters ? (
        <Drawer open={sheetOpen} onClose={() => setSheetOpen(false)} anchor="bottom" title="Filtres">
          <div className="flex flex-col gap-md">
            {filters}
            {trailing}
            <div className="flex flex-col-reverse gap-sm pt-sm sm:flex-row sm:justify-end">
              {onReset ? (
                <button
                  type="button"
                  onClick={() => {
                    onReset();
                    setSheetOpen(false);
                  }}
                  className="min-h-[44px] rounded-lg border border-amud-outline-variant px-lg text-label-md text-amud-on-surface"
                >
                  Réinitialiser
                </button>
              ) : null}
              <button
                type="button"
                onClick={() => setSheetOpen(false)}
                className="min-h-[44px] rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white"
              >
                Voir les résultats
              </button>
            </div>
          </div>
        </Drawer>
      ) : null}
    </>
  );
}

/* ------------------------------------------------------------------ *
 * StatCard — carte KPI unique du module. Les 3 variantes qui coexistaient
 * (barre d'accent latérale côté Admin/Commercial, icône + CountUp côté
 * Dashboard centre) sont fusionnées ici : `accent` pour la barre, `icon` et
 * `href` optionnels.
 * ------------------------------------------------------------------ */
export function StatCard({
  label,
  value,
  icon,
  href,
  accent,
  suffix,
  animate = true,
  onClick,
}: {
  label: string;
  value: number;
  icon?: string;
  href?: string;
  accent?: string;
  suffix?: string;
  animate?: boolean;
  onClick?: () => void;
}) {
  const body = (
    <>
      {accent ? <div className={`absolute bottom-0 left-0 top-0 w-1 ${accent}`} aria-hidden="true" /> : null}
      <div className="mb-sm flex items-start justify-between gap-sm">
        <span className="text-label-sm uppercase tracking-wider text-amud-on-surface-variant">{label}</span>
        {icon ? (
          <span className="material-symbols-outlined shrink-0 text-[20px] text-amud-primary" aria-hidden="true">
            {icon}
          </span>
        ) : null}
      </div>
      <span className="text-headline-md text-amud-on-surface sm:text-headline-lg">
        {animate ? <CountUp value={value} formatter={(v) => `${Math.round(v).toLocaleString('fr-FR')}${suffix ?? ''}`} /> : `${value.toLocaleString('fr-FR')}${suffix ?? ''}`}
      </span>
    </>
  );

  const cls =
    'relative flex min-h-[96px] flex-col justify-center overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest p-md shadow-sm transition-colors sm:p-lg';

  if (href) {
    return (
      <Link href={href} className={`${cls} hover:border-amud-primary`}>
        {body}
      </Link>
    );
  }
  if (onClick) {
    return (
      <button type="button" onClick={onClick} className={`${cls} text-left hover:border-amud-primary`}>
        {body}
      </button>
    );
  }
  return <div className={cls}>{body}</div>;
}

/* ------------------------------------------------------------------ *
 * PageHeader — titre + sous-titre + action principale. Sur mobile l'action
 * devient pleine largeur (cible tactile), sur desktop elle repasse à droite.
 * ------------------------------------------------------------------ */
export function PageHeader({
  title,
  subtitle,
  actionLabel,
  onAction,
  actionIcon = 'add',
  children,
}: {
  title: string;
  subtitle?: string;
  actionLabel?: string;
  onAction?: () => void;
  actionIcon?: string;
  children?: ReactNode;
}) {
  return (
    <div className="mb-lg flex flex-col items-start justify-between gap-md sm:flex-row sm:items-center">
      <div className="min-w-0">
        <h1 className="text-headline-md text-amud-on-surface">{title}</h1>
        {subtitle ? <p className="mt-0.5 text-body-md text-amud-on-surface-variant">{subtitle}</p> : null}
      </div>
      <div className="flex w-full shrink-0 items-center gap-sm sm:w-auto">
        {children}
        {actionLabel && onAction ? (
          <button
            onClick={onAction}
            className="flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg bg-amud-primary px-lg text-label-md font-medium text-white shadow-sm transition-colors hover:bg-amud-primary-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary sm:w-auto"
          >
            <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
              {actionIcon}
            </span>
            {actionLabel}
          </button>
        ) : null}
      </div>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ReadOnlyNotice — bandeau "lecture seule" (rôle sans permission côté
 * Centre, espace Commercial en consultation).
 * ------------------------------------------------------------------ */
export function ReadOnlyNotice({ children }: { children: ReactNode }) {
  return (
    <div className="mb-lg flex items-start gap-sm rounded-lg border border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed px-md py-sm text-label-md text-amud-on-tertiary-fixed">
      <span className="material-symbols-outlined text-[18px]" aria-hidden="true">
        visibility
      </span>
      <span>{children}</span>
    </div>
  );
}

/* ------------------------------------------------------------------ *
 * ResponsiveTable — table de consultation (sans CRUD) qui bascule en
 * cartes en dessous de `md`, comme `CenterCrudTable` le fait pour les
 * listes éditables. Utilisée par les écrans en lecture (rémunérations,
 * présences, historiques) pour qu'aucun tableau du module ne force le
 * défilement horizontal sur un écran de 360px.
 * ------------------------------------------------------------------ */
export function ResponsiveTable({
  columns,
  rows,
  empty,
  caption,
}: {
  columns: string[];
  rows: { id: string; cells: ReactNode[]; badge?: { label: string; tone: BadgeTone }; action?: ReactNode }[];
  empty: ReactNode;
  caption?: string;
}) {
  if (rows.length === 0) {
    return <div className="rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">{empty}</div>;
  }

  return (
    <>
      <ul className="flex flex-col gap-md md:hidden">
        {rows.map((row) => (
          <li key={row.id} className="overflow-hidden rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm">
            <div className="flex items-start justify-between gap-sm p-md">
              <p className="min-w-0 flex-1 truncate text-label-md font-semibold text-amud-on-surface">{row.cells[0]}</p>
              {row.badge ? <Badge tone={row.badge.tone}>{row.badge.label}</Badge> : null}
            </div>
            <dl className="grid grid-cols-2 gap-x-md gap-y-sm border-t border-amud-outline-variant px-md py-sm">
              {columns.slice(1).map((label, i) => (
                <div key={label} className="min-w-0">
                  <dt className="text-label-sm uppercase tracking-wide text-amud-on-surface-variant">{label}</dt>
                  <dd className="truncate text-body-md text-amud-on-surface">{row.cells[i + 1]}</dd>
                </div>
              ))}
            </dl>
            {row.action ? <div className="border-t border-amud-outline-variant p-md">{row.action}</div> : null}
          </li>
        ))}
      </ul>

      <div className="hidden overflow-x-auto rounded-xl border border-amud-outline-variant bg-amud-surface-container-lowest shadow-sm md:block">
        <table className="w-full border-collapse text-left">
          {caption ? <caption className="sr-only">{caption}</caption> : null}
          <thead>
            <tr className="border-b border-amud-outline-variant bg-amud-surface-container-low/50 text-label-sm uppercase tracking-wider text-amud-on-surface-variant">
              {columns.map((c) => (
                <th key={c} scope="col" className="whitespace-nowrap px-6 py-3">
                  {c}
                </th>
              ))}
              {rows.some((r) => r.action) ? (
                <th scope="col" className="px-6 py-3 text-right">
                  Actions
                </th>
              ) : null}
            </tr>
          </thead>
          <tbody className="divide-y divide-amud-outline-variant">
            {rows.map((row) => (
              <tr key={row.id} className="transition-colors hover:bg-amud-surface-container-low/40">
                {row.cells.map((cell, i) => (
                  <td key={i} className="px-6 py-3 text-body-md text-amud-on-surface-variant">
                    {i === 0 ? <span className="font-medium text-amud-on-surface">{cell}</span> : cell}
                  </td>
                ))}
                {rows.some((r) => r.action) ? <td className="px-6 py-3 text-right">{row.action}</td> : null}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </>
  );
}

/* ------------------------------------------------------------------ *
 * SegmentedControl — sélecteur de vue (jour / semaine / mois du planning,
 * onglets courts). Défile horizontalement sur mobile plutôt que de casser
 * la ligne, cibles de 44px.
 * ------------------------------------------------------------------ */
export function SegmentedControl<T extends string>({
  options,
  value,
  onChange,
  label,
}: {
  options: { value: T; label: string }[];
  value: T;
  onChange: (next: T) => void;
  label?: string;
}) {
  return (
    <div className="flex gap-sm overflow-x-auto pb-1" role="tablist" aria-label={label}>
      {options.map((o) => {
        const active = o.value === value;
        return (
          <button
            key={o.value}
            role="tab"
            aria-selected={active}
            onClick={() => onChange(o.value)}
            className={`min-h-[44px] shrink-0 rounded-lg border px-4 text-label-md font-medium transition-colors ${
              active
                ? 'border-amud-primary bg-amud-primary/10 text-amud-primary'
                : 'border-amud-outline-variant text-amud-on-surface-variant hover:bg-amud-surface-container-low'
            }`}
          >
            {o.label}
          </button>
        );
      })}
    </div>
  );
}
