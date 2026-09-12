'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { NavItem, isNavActive, useDropdown } from '@/components/amud/ui';
import { InlineLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { GlobalSearch, useGlobalSearchShortcut, type GlobalSearchResult } from '@/components/amud/GlobalSearch';
import { NotificationCenter } from '@/components/amud/NotificationCenter';
import { RoleBottomNav } from '@/components/amud/RoleBottomNav';
import { useCurrentCenter } from '@/lib/amud/currentCentre';
import { CENTER_ROLES, CENTER_ROLE_LABELS } from '@/data/amud/centerTypes';
import { centresCollection } from '@/lib/amud/localCentres';
import { centresSeed } from '@/data/amud/centres';
import { loadLocalCenterStudents } from '@/lib/amud/localCenterStudents';
import { loadLocalCenterTeachers } from '@/lib/amud/localCenterTeachers';
import { loadLocalCenterFormations } from '@/lib/amud/localCenterFormations';
import { loadLocalCenterGroups } from '@/lib/amud/localCenterGroups';
import { useCollection } from '@/lib/amud/storage/useCollection';

/** Recherche header, bornée aux données du centre actif (même pattern que `useGlobalSearchResults` d'AdminShell). */
function useCentreSearchResults(query: string, centerId: string): GlobalSearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: GlobalSearchResult[] = [];

    for (const s of loadLocalCenterStudents().filter((s) => s.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'group').length >= 3) break;
      const nom = `${s.prenom} ${s.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `etu-${s.id}`, label: nom, sub: 'Étudiant', href: '/amud/centre/etudiants', icon: 'group' });
      }
    }
    for (const t of loadLocalCenterTeachers().filter((t) => t.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'cast_for_education').length >= 3) break;
      const nom = `${t.prenom} ${t.nom}`;
      if (nom.toLowerCase().includes(q)) {
        results.push({ id: `ens-${t.id}`, label: nom, sub: 'Enseignant', href: '/amud/centre/enseignants', icon: 'cast_for_education' });
      }
    }
    for (const f of loadLocalCenterFormations().filter((f) => f.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'menu_book').length >= 3) break;
      if (f.nom.toLowerCase().includes(q)) {
        results.push({ id: `for-${f.id}`, label: f.nom, sub: 'Formation', href: '/amud/centre/formations', icon: 'menu_book' });
      }
    }
    for (const g of loadLocalCenterGroups().filter((g) => g.centerId === centerId)) {
      if (results.filter((r) => r.icon === 'diversity_3').length >= 3) break;
      if (g.nom.toLowerCase().includes(q)) {
        results.push({ id: `grp-${g.id}`, label: g.nom, sub: 'Groupe', href: '/amud/centre/groupes', icon: 'diversity_3' });
      }
    }

    return results.slice(0, 8);
  }, [query, centerId]);
}

type CentreNavItem = {
  href: string;
  icon: string;
  label: string;
  group: string;
  /** Présent dans la barre de navigation basse mobile (les autres vont dans « Plus »). */
  inBottomNav?: boolean;
  bottomIcon?: string;
  bottomLabel?: string;
};

/**
 * Source unique des 15 entrées de l'espace Centre : sidebar desktop, barre
 * basse mobile et tiroir « Plus » sont dérivés du même tableau — exactement
 * comme `CompanyShell` le fait pour l'espace Entreprise, pour que passer
 * d'un espace à l'autre ne change ni la structure ni les gestes.
 */
const NAV: CentreNavItem[] = [
  { href: '/amud/centre/dashboard', icon: 'dashboard', label: 'Tableau de bord', group: '', inBottomNav: true, bottomLabel: 'Accueil' },
  { href: '/amud/centre/etudiants', icon: 'group', label: 'Étudiants', group: 'Pédagogie', inBottomNav: true },
  { href: '/amud/centre/planning', icon: 'calendar_month', label: 'Planning', group: 'Pédagogie', inBottomNav: true },
  { href: '/amud/centre/paiements-etudiants', icon: 'payments', label: 'Paiements étudiants', group: 'Finances', inBottomNav: true, bottomLabel: 'Paiements' },
  { href: '/amud/centre/formations', icon: 'menu_book', label: 'Formations', group: 'Pédagogie' },
  { href: '/amud/centre/enseignants', icon: 'cast_for_education', label: 'Enseignants', group: 'Pédagogie' },
  { href: '/amud/centre/groupes', icon: 'diversity_3', label: 'Groupes', group: 'Pédagogie' },
  { href: '/amud/centre/presences', icon: 'fact_check', label: 'Présences', group: 'Pédagogie' },
  { href: '/amud/centre/remuneration', icon: 'account_balance_wallet', label: 'Rémunération', group: 'Finances' },
  { href: '/amud/centre/tarifs', icon: 'sell', label: 'Tarifs', group: 'Finances' },
  { href: '/amud/centre/leads', icon: 'person_add', label: 'Leads', group: 'Développement' },
  { href: '/amud/centre/site', icon: 'language', label: 'Site public', group: 'Développement' },
  { href: '/amud/centre/statistiques', icon: 'bar_chart', label: 'Statistiques', group: 'Développement' },
  { href: '/amud/centre/profil', icon: 'storefront', label: 'Profil du centre', group: 'Centre' },
  { href: '/amud/centre/parametres', icon: 'settings', label: 'Paramètres', group: 'Centre' },
];

const GROUP_LABELS = ['Pédagogie', 'Finances', 'Développement', 'Centre'];
const SIDEBAR_GROUPS = [{ label: '', items: NAV.filter((i) => i.group === '') }].concat(
  GROUP_LABELS.map((label) => ({ label, items: NAV.filter((i) => i.group === label) })),
);

/**
 * Coquille de l'espace self-service `/amud/centre/*` (cahier des charges
 * §25-42), même architecture que `AdminShell`/`CommercialShell` : nav fixe,
 * header avec cloche (`scope:'centre'`), `ToastProvider`. Comme le reste du
 * module `/amud` n'a pas de vraie authentification, le sélecteur "Centre" +
 * "Rôle" dans le menu profil simule "je suis connecté à ce centre, avec ce
 * rôle" (`useCurrentCenter`) — indispensable ici puisque toutes les pages
 * ont besoin de savoir "mon" `centerId`, contrairement à Admin/Commercial
 * qui voient plusieurs centres à la fois. Chaque page applique en plus
 * `canPerform(role, action)` (`centerPermissions.ts`) pour désactiver/bloquer
 * réellement les actions que le rôle courant n'a pas le droit de faire — le
 * menu de rôle ci-dessous ne change donc pas que l'affichage.
 */
export function CentreShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const profileMenu = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');
  const [searchOpen, setSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  const { centerId, role, setCenterId, setRole } = useCurrentCenter();
  const [centres] = useCollection(centresCollection, centresSeed);
  const currentCentre = useMemo(() => centres.find((c) => c.id === centerId), [centres, centerId]);
  const results = useCentreSearchResults(query, centerId);

  useGlobalSearchShortcut(() => {
    setSearchOpen(true);
    searchInputRef.current?.focus();
  });

  useEffect(() => {
    setSearchOpen(false);
    profileMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goToResult(href: string) {
    setSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant px-lg py-2.5 ${collapsed ? 'md:px-md' : ''}`}>
            <img src="/assets/images/logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
            <div className={hiddenWhenCollapsed}>
              <h1 className="text-title-lg font-bold text-amud-primary">Amud Skills</h1>
              <p className="truncate text-label-sm text-amud-on-surface-variant">{currentCentre?.nom ?? 'Espace Centre'}</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md" aria-label="Navigation de l’espace Centre">
            <div className="flex flex-col gap-md">
              {SIDEBAR_GROUPS.map((group) => (
                <div key={group.label || 'root'}>
                  {group.label ? (
                    <div className={`px-4 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>{group.label}</div>
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    {group.items.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/centre/dashboard')}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </nav>

          <div className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <Link
              href="/amud"
              className="flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              title={collapsed ? "Changer d'espace" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
            </Link>
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-amud-outline-variant/40 bg-amud-surface/90 px-gutter backdrop-blur-md">
            <div className="flex items-center gap-1">
              <button
                onClick={() => setCollapsed((c) => !c)}
                className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
                aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
                aria-pressed={collapsed}
              >
                <span className="material-symbols-outlined">menu</span>
              </button>
            </div>
            <GlobalSearch
              query={query}
              onQueryChange={setQuery}
              results={results}
              onSelect={goToResult}
              open={searchOpen}
              onOpenChange={setSearchOpen}
              inputRef={searchInputRef}
              placeholder="Rechercher un étudiant, un enseignant…"
              className="relative hidden w-64 md:block"
            />
            <div className="ml-auto flex items-center gap-sm">
              <NotificationCenter key={pathname} scope="centre" />
              <div ref={profileMenu.ref} className="relative">
                <button onClick={() => profileMenu.setOpen((v) => !v)} className="flex h-9 w-9 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white transition-opacity hover:opacity-90" aria-label="Menu du compte" aria-haspopup="menu" aria-expanded={profileMenu.open}>
                  {(currentCentre?.nom ?? 'C').charAt(0)}
                </button>
                {profileMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                      <div className="text-label-md font-semibold text-amud-on-surface">{currentCentre?.nom ?? 'Espace Centre'}</div>
                      <div className="text-label-sm text-amud-on-surface-variant">Simulation — aucune vraie authentification</div>
                    </div>
                    <div className="border-b border-amud-outline-variant">
                      <InlineLanguageThemeControls />
                    </div>
                    <div className="flex flex-col gap-sm p-md">
                      <label className="text-label-sm text-amud-on-surface-variant">
                        Centre actif
                        <select value={centerId} onChange={(e) => setCenterId(e.target.value)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                          {centres.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.nom}
                            </option>
                          ))}
                        </select>
                      </label>
                      <label className="text-label-sm text-amud-on-surface-variant">
                        Rôle simulé
                        <select value={role} onChange={(e) => setRole(e.target.value as typeof role)} className="mt-1 w-full rounded-lg border border-amud-outline-variant bg-amud-surface px-3 py-2 text-body-md outline-none focus:ring-2 focus:ring-amud-primary">
                          {CENTER_ROLES.map((r) => (
                            <option key={r} value={r}>
                              {CENTER_ROLE_LABELS[r]}
                            </option>
                          ))}
                        </select>
                      </label>
                    </div>
                    <div className="flex flex-col border-t border-amud-outline-variant py-1">
                      <Link href="/amud/centre/parametres" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">settings</span> Paramètres
                      </Link>
                      <button type="button" className="flex items-center gap-sm px-md py-sm text-left text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">help</span> Aide
                      </button>
                      <Link href="/amud" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">apps</span> Changer d&apos;espace
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>
          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in p-margin-mobile pb-24 md:p-margin-desktop md:pb-margin-desktop">
            {children}
          </main>
        </div>

        <RoleBottomNav items={NAV} />
      </div>
    </ToastProvider>
  );
}
