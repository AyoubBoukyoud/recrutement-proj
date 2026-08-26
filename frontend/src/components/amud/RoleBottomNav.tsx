'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { Drawer, NavItem, isNavActive } from '@/components/amud/ui';

export type RoleNavItem = {
  href: string;
  icon: string;
  label: string;
  /** Section affichée dans le tiroir "Plus" pour les entrées hors barre du bas. Omis = pas de section (racine). */
  group?: string;
  /** Présent dans la barre de navigation basse mobile ; les autres vont dans le tiroir "Plus". */
  inBottomNav?: boolean;
  /** Icône/libellé courts pour la barre du bas, si différents de la sidebar. */
  bottomIcon?: string;
  bottomLabel?: string;
};

/**
 * Barre de navigation basse + tiroir "Plus" mobile — unifie le mécanisme déjà
 * éprouvé par `CentreShell`/`StudentShell`/`TeacherShell`/`CompanyShell`
 * (une seule config de nav pour sidebar desktop + barre basse + "Plus") pour
 * que `AdminShell`/`CommercialShell`/`EmployerShell` l'adoptent aussi, plutôt
 * que de garder un tiroir plein écran différent en dessous de `md`. Gère son
 * propre état "Plus" (fermeture automatique au changement de route) — les
 * coquilles n'ont donc rien à orchestrer.
 */
export function RoleBottomNav({
  items,
  activeClassName = 'text-amud-primary',
}: {
  items: RoleNavItem[];
  activeClassName?: string;
}) {
  const pathname = usePathname();
  const [plusOpen, setPlusOpen] = useState(false);

  useEffect(() => {
    setPlusOpen(false);
  }, [pathname]);

  const bottomItems = items.filter((i) => i.inBottomNav);
  const restItems = items.filter((i) => !i.inBottomNav);
  const groupLabels = Array.from(new Set(restItems.map((i) => i.group).filter((g): g is string => !!g)));
  const plusGroups = groupLabels
    .map((label) => ({ label, items: restItems.filter((i) => i.group === label) }))
    .filter((g) => g.items.length > 0);
  const ungroupedRest = restItems.filter((i) => !i.group);
  const hasPlus = plusGroups.length > 0 || ungroupedRest.length > 0;

  if (bottomItems.length === 0) return null;

  return (
    <>
      <nav
        className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-amud-outline-variant/40 bg-amud-surface-container-lowest/95 shadow-subtle backdrop-blur-md md:hidden"
        style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
        aria-label="Navigation principale"
      >
        {bottomItems.map((item, i) => {
          const active = isNavActive(pathname, item.href, i === 0);
          return (
            <Link
              key={item.href}
              href={item.href}
              aria-current={active ? 'page' : undefined}
              className={`flex flex-1 flex-col items-center justify-center gap-0.5 px-1 text-[11px] font-medium transition-colors ${
                active ? activeClassName : 'text-amud-on-surface-variant'
              }`}
            >
              <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                {item.bottomIcon ?? item.icon}
              </span>
              <span className="truncate">{item.bottomLabel ?? item.label}</span>
            </Link>
          );
        })}
        {hasPlus ? (
          <button
            type="button"
            onClick={() => setPlusOpen(true)}
            className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-amud-on-surface-variant"
            aria-haspopup="menu"
            aria-expanded={plusOpen}
          >
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            Plus
          </button>
        ) : null}
      </nav>

      {hasPlus ? (
        <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} anchor="bottom" title="Plus d’options">
          <div className="flex flex-col gap-lg">
            {ungroupedRest.length > 0 ? (
              <div className="flex flex-col gap-0.5">
                {ungroupedRest.map((item) => (
                  <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href)} />
                ))}
              </div>
            ) : null}
            {plusGroups.map((group) => (
              <div key={group.label}>
                <div className="px-1 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline">{group.label}</div>
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Drawer>
      ) : null}
    </>
  );
}
