'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { Drawer, NavItem, Toggle, isNavActive, useDropdown } from '@/components/amud/ui';
import { HeaderLanguageThemeControls } from '@/components/amud/HeaderLanguageThemeControls';
import { ToastProvider } from '@/components/amud/Toast';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { entreprisesSeed } from '@/data/amud/entreprises';
import { entreprisesCollection } from '@/lib/amud/localEntreprises';
import { loadLocalApplications } from '@/lib/amud/localApplications';
import { loadLocalOffres } from '@/lib/amud/localOffres';
import { notificationsSeed } from '@/data/amud/notifications';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';

type NavEntry = {
  href: string;
  icon: string;
  label: string;
  group: string;
  inBottomNav?: boolean;
  bottomIcon?: string;
  bottomLabel?: string;
};

/**
 * Config de navigation unique pour la sidebar desktop, la barre du bas
 * mobile et le tiroir "Plus" — un seul tableau pour que les trois surfaces
 * ne puissent jamais diverger (cahier des charges §2-3). En dessous de `md`
 * la sidebar disparaît entièrement (pas de tiroir off-canvas comme les
 * autres coquilles) : la barre du bas en tient lieu.
 */
const NAV: NavEntry[] = [
  { href: '/amud/entreprise/dashboard', icon: 'dashboard', label: 'Tableau de bord', group: '', inBottomNav: true, bottomLabel: 'Accueil' },
  { href: '/amud/entreprise/offres', icon: 'work', label: 'Offres', group: 'Recrutement', inBottomNav: true },
  { href: '/amud/entreprise/candidatures', icon: 'assignment', label: 'Candidatures', group: 'Recrutement', inBottomNav: true },
  { href: '/amud/entreprise/candidats', icon: 'person_search', label: 'Candidats', group: 'Recrutement' },
  { href: '/amud/entreprise/favoris', icon: 'star', label: 'Favoris', group: 'Recrutement' },
  { href: '/amud/entreprise/entretiens', icon: 'event', label: 'Entretiens', group: 'Recrutement' },
  { href: '/amud/entreprise/messages', icon: 'mail', label: 'Messages', group: 'Communication', inBottomNav: true },
  { href: '/amud/entreprise/notifications', icon: 'notifications', label: 'Notifications', group: 'Communication' },
  { href: '/amud/entreprise/profil', icon: 'apartment', label: 'Mon entreprise', group: 'Entreprise', inBottomNav: true, bottomIcon: 'storefront', bottomLabel: 'Profil' },
  { href: '/amud/entreprise/equipe', icon: 'groups', label: 'Équipe', group: 'Entreprise' },
  { href: '/amud/entreprise/statistiques', icon: 'monitoring', label: 'Statistiques', group: 'Entreprise' },
  { href: '/amud/entreprise/parametres', icon: 'settings', label: 'Paramètres', group: 'Configuration' },
];

const GROUP_LABELS = ['', 'Recrutement', 'Communication', 'Entreprise', 'Configuration'];
const BOTTOM_ITEMS = NAV.filter((item) => item.inBottomNav);
const PLUS_GROUPS = GROUP_LABELS.map((label) => ({ label, items: NAV.filter((item) => item.group === label && !item.inBottomNav) })).filter((g) => g.items.length > 0);

type SearchResult = { id: string; label: string; sub: string; href: string; icon: string };

/** Recherche header, bornée aux offres/candidatures de l'entreprise connectée (même pattern que `useEmployerSearchResults`). */
function useCompanySearchResults(query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];

    const applications = loadLocalApplications().filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const a of applications) {
      if (results.filter((r) => r.icon === 'person').length >= 4) break;
      if (a.candidateNom.toLowerCase().includes(q) || a.offerTitre.toLowerCase().includes(q)) {
        results.push({ id: `app-${a.id}`, label: a.candidateNom, sub: `Candidature · ${a.offerTitre}`, href: `/amud/entreprise/candidatures/${a.id}`, icon: 'person' });
      }
    }

    const offres = loadLocalOffres().filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const o of offres) {
      if (results.filter((r) => r.icon === 'work').length >= 4) break;
      if (o.titre.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.statut}`, href: `/amud/entreprise/offres/${o.id}`, icon: 'work' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

export function CompanyShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [collapsed, setCollapsed] = useState(false);
  const [plusOpen, setPlusOpen] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);
  const searchMenu = useDropdown<HTMLDivElement>();
  const notifMenu = useDropdown<HTMLDivElement>();
  const settingsMenu = useDropdown<HTMLDivElement>();
  const profileMenu = useDropdown<HTMLDivElement>();

  const [entreprises] = useCollection(entreprisesCollection, entreprisesSeed);
  const entreprise = useMemo(() => entreprises.find((e) => e.id === CURRENT_EMPLOYER.entrepriseId), [entreprises]);

  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const companyNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'employer').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications],
  );
  const totalAlerts = companyNotifications.filter((n) => !n.read).length;
  const results = useCompanySearchResults(query);
  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  useEffect(() => {
    setPlusOpen(false);
    setMobileSearchOpen(false);
    searchMenu.setOpen(false);
    notifMenu.setOpen(false);
    settingsMenu.setOpen(false);
    profileMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goToResult(href: string) {
    searchMenu.setOpen(false);
    setMobileSearchOpen(false);
    setQuery('');
    router.push(href);
  }

  const companyInitial = (entreprise?.nom ?? 'E').charAt(0).toUpperCase();

  return (
    <ToastProvider>
      <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-surface">
        {/* Sidebar — md et plus uniquement, pas de tiroir mobile : la barre du bas la remplace en dessous de md. */}
        <aside
          className={`group fixed left-0 top-0 z-40 hidden h-screen flex-col border-r border-amud-outline-variant bg-amud-surface-container-lowest transition-[width] duration-200 ease-in-out md:flex ${
            collapsed ? 'md:w-20 md:hover:w-64' : 'md:w-64'
          }`}
        >
          <div className={`flex items-center gap-sm border-b border-amud-outline-variant p-lg ${collapsed ? 'md:px-md' : ''}`}>
            <div className="flex h-10 w-10 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amud-primary-container">
              {entreprise?.logo ? (
                <img src={entreprise.logo} alt="" className="h-full w-full object-cover" />
              ) : (
                <span className="material-symbols-outlined text-white">apartment</span>
              )}
            </div>
            <div className={hiddenWhenCollapsed}>
              <h1 className="truncate text-title-lg font-bold text-amud-primary">{entreprise?.nom ?? 'Espace Entreprise'}</h1>
              <p className="text-label-sm text-amud-on-surface-variant">Espace recruteur</p>
            </div>
          </div>

          <nav className="flex-1 overflow-y-auto px-sm py-md">
            {GROUP_LABELS.map((label) => {
              const items = NAV.filter((item) => item.group === label);
              if (items.length === 0) return null;
              return (
                <div key={label || 'root'} className={label ? 'mt-4' : ''}>
                  {label ? (
                    <div className={`px-md py-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline ${hiddenWhenCollapsed}`}>{label}</div>
                  ) : null}
                  <div className="flex flex-col gap-0.5">
                    {items.map((item) => (
                      <NavItem
                        key={item.href}
                        href={item.href}
                        icon={item.icon}
                        label={item.label}
                        active={isNavActive(pathname, item.href, item.href === '/amud/entreprise/dashboard')}
                        collapsed={collapsed}
                      />
                    ))}
                  </div>
                </div>
              );
            })}
          </nav>

          <div className={`border-t border-amud-outline-variant p-md ${collapsed ? 'md:px-sm' : ''}`} style={{ paddingBottom: 'max(16px, env(safe-area-inset-bottom))' }}>
            <div className={`flex items-center gap-3 rounded-lg p-2 ${collapsed ? 'md:justify-center' : ''}`}>
              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-amud-primary-container font-bold text-white">{companyInitial}</div>
              <div className={`min-w-0 ${hiddenWhenCollapsed}`}>
                <div className="truncate text-label-md font-bold text-amud-on-surface">{CURRENT_EMPLOYER.userNom}</div>
                <div className="truncate text-label-sm text-amud-on-surface-variant">{entreprise?.nom ?? CURRENT_EMPLOYER.entrepriseNom}</div>
              </div>
            </div>
            <Link
              href="/amud"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg border border-amud-outline-variant px-3 py-2 text-label-sm font-medium text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
              title={collapsed ? "Changer d'espace" : undefined}
            >
              <span className="material-symbols-outlined text-[18px]">apps</span>
              <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
            </Link>
          </div>
        </aside>

        <div className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${collapsed ? 'md:ml-20' : 'md:ml-64'}`}>
          <header className="sticky top-0 z-30 flex h-16 items-center gap-sm border-b border-amud-outline-variant bg-amud-surface px-margin-mobile md:px-gutter">
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              aria-pressed={collapsed}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>

            <div className="flex min-w-0 items-center gap-sm md:hidden">
              <div className="flex h-9 w-9 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-amud-primary-container">
                {entreprise?.logo ? <img src={entreprise.logo} alt="" className="h-full w-full object-cover" /> : <span className="material-symbols-outlined text-white text-[20px]">apartment</span>}
              </div>
              <span className="truncate text-title-lg font-bold text-amud-on-surface">{entreprise?.nom ?? 'Espace Entreprise'}</span>
            </div>

            <div ref={searchMenu.ref} className="relative hidden max-w-md flex-1 md:block">
              <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  searchMenu.setOpen(true);
                }}
                onFocus={() => searchMenu.setOpen(true)}
                className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                placeholder="Rechercher une candidature, une offre…"
                aria-label="Rechercher une candidature, une offre"
                type="text"
              />
              {searchMenu.open && query.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  {results.length === 0 ? (
                    <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
                  ) : (
                    results.map((r) => (
                      <button key={r.id} onClick={() => goToResult(r.href)} className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-amud-primary">{r.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label-md text-amud-on-surface">{r.label}</span>
                          <span className="block truncate text-label-sm text-amud-on-surface-variant">{r.sub}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>

            <div className="ml-auto flex items-center gap-1 md:gap-sm">
              <button
                onClick={() => setMobileSearchOpen((v) => !v)}
                className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low md:hidden"
                aria-label="Rechercher"
                aria-expanded={mobileSearchOpen}
              >
                <span className="material-symbols-outlined">search</span>
              </button>

              <Link
                href="/amud/entreprise/offres/nouveau"
                className="hidden items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-md py-2 text-label-md font-medium text-white shadow-sm transition-all hover:brightness-110 active:scale-95 lg:flex"
              >
                <span className="material-symbols-outlined text-[18px] text-white">add</span>
                Créer une offre
              </Link>

              <div ref={notifMenu.ref} className="relative">
                <button
                  onClick={() => notifMenu.setOpen((v) => !v)}
                  className="relative rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
                  aria-label="Notifications"
                  aria-haspopup="menu"
                  aria-expanded={notifMenu.open}
                >
                  <span className="material-symbols-outlined">notifications</span>
                  {totalAlerts > 0 ? (
                    <span className="absolute right-1 top-1 flex h-4 min-w-[16px] animate-pulse items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">
                      {totalAlerts}
                    </span>
                  ) : null}
                </button>
                {notifMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-80 max-w-[calc(100vw-2rem)] overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                      <span>Notifications</span>
                      {totalAlerts > 0 ? (
                        <button onClick={() => markAllNotificationsRead('employer')} className="text-label-sm font-normal text-amud-primary hover:underline">
                          Tout marquer comme lu
                        </button>
                      ) : null}
                    </div>
                    <div className="flex max-h-96 flex-col overflow-y-auto">
                      {companyNotifications.length === 0 ? (
                        <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
                      ) : (
                        companyNotifications.slice(0, 10).map((n) => (
                          <button
                            key={n.id}
                            onClick={() => {
                              markNotificationRead(n.id);
                              notifMenu.setOpen(false);
                              if (n.href) router.push(n.href);
                            }}
                            className={`flex w-full items-start gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low ${n.read ? 'opacity-60' : ''}`}
                          >
                            <span className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${n.read ? 'bg-amud-outline-variant' : 'bg-amud-secondary'}`} />
                            <span className="min-w-0 flex-1">
                              <span className="block text-body-md text-amud-on-surface">{n.title}</span>
                              <span className="block text-label-sm text-amud-on-surface-variant">{n.category}</span>
                            </span>
                          </button>
                        ))
                      )}
                    </div>
                    <Link href="/amud/entreprise/notifications" onClick={() => notifMenu.setOpen(false)} className="block border-t border-amud-outline-variant px-md py-sm text-center text-label-sm font-medium text-amud-primary hover:underline">
                      Voir toutes les notifications
                    </Link>
                  </div>
                ) : null}
              </div>

              <div ref={settingsMenu.ref} className="relative hidden sm:block">
                <button
                  onClick={() => settingsMenu.setOpen((v) => !v)}
                  className="rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
                  aria-label="Réglages"
                  aria-haspopup="menu"
                  aria-expanded={settingsMenu.open}
                >
                  <span className="material-symbols-outlined">settings</span>
                </button>
                {settingsMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">Réglages rapides</div>
                    <div className="flex flex-col gap-sm p-md">
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-amud-on-surface">Notifications par email</span>
                        <Toggle checked={emailNotif} onChange={setEmailNotif} size="sm" label="Notifications par email" />
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-label-md text-amud-on-surface">Notifications push</span>
                        <Toggle checked={pushNotif} onChange={setPushNotif} size="sm" label="Notifications push" />
                      </div>
                    </div>
                  </div>
                ) : null}
              </div>

              <HeaderLanguageThemeControls />

              <div className="hidden h-8 w-[1px] bg-amud-outline-variant sm:block" />

              <div ref={profileMenu.ref} className="relative">
                <button
                  onClick={() => profileMenu.setOpen((v) => !v)}
                  className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amud-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
                  aria-label="Menu du compte"
                  aria-haspopup="menu"
                  aria-expanded={profileMenu.open}
                >
                  {CURRENT_EMPLOYER.userNom.charAt(0)}
                </button>
                {profileMenu.open ? (
                  <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                    <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                      <div className="text-label-md font-semibold text-amud-on-surface">{CURRENT_EMPLOYER.userNom}</div>
                      <div className="text-label-sm text-amud-on-surface-variant">{entreprise?.nom ?? CURRENT_EMPLOYER.entrepriseNom}</div>
                    </div>
                    <div className="flex flex-col py-1">
                      <Link href="/amud/entreprise/profil" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">apartment</span> Mon entreprise
                      </Link>
                      <Link href="/amud" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">apps</span> Changer d&apos;espace
                      </Link>
                      <Link href="/amud" onClick={() => profileMenu.setOpen(false)} className="flex items-center gap-sm px-md py-sm text-label-md text-amud-error transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-[18px]">logout</span> Déconnexion
                      </Link>
                    </div>
                  </div>
                ) : null}
              </div>
            </div>
          </header>

          {mobileSearchOpen ? (
            <div className="border-b border-amud-outline-variant bg-amud-surface p-md md:hidden">
              <div className="relative">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
                {/* eslint-disable-next-line jsx-a11y/no-autofocus */}
                <input
                  autoFocus
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:border-transparent focus:ring-2 focus:ring-amud-primary"
                  placeholder="Rechercher une candidature, une offre…"
                  aria-label="Rechercher une candidature, une offre"
                  type="text"
                />
              </div>
              {query.trim().length >= 2 ? (
                <div className="mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface">
                  {results.length === 0 ? (
                    <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
                  ) : (
                    results.map((r) => (
                      <button key={r.id} onClick={() => goToResult(r.href)} className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low">
                        <span className="material-symbols-outlined text-amud-primary">{r.icon}</span>
                        <span className="min-w-0 flex-1">
                          <span className="block truncate text-label-md text-amud-on-surface">{r.label}</span>
                          <span className="block truncate text-label-sm text-amud-on-surface-variant">{r.sub}</span>
                        </span>
                      </button>
                    ))
                  )}
                </div>
              ) : null}
            </div>
          ) : null}

          <main key={pathname} className="min-w-0 flex-1 animate-amud-rise-in space-y-xl p-margin-mobile pb-24 md:p-margin-desktop md:pb-margin-desktop">
            {children}
          </main>
        </div>

        {/* Barre du bas — remplace la sidebar en dessous de md (cahier des charges §2). */}
        <nav
          className="fixed inset-x-0 bottom-0 z-40 flex h-16 items-stretch border-t border-amud-outline-variant bg-amud-surface-container-lowest md:hidden"
          style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
          aria-label="Navigation principale"
        >
          {BOTTOM_ITEMS.map((item) => {
            const active = isNavActive(pathname, item.href, item.href === '/amud/entreprise/dashboard');
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium transition-colors ${active ? 'text-amud-primary' : 'text-amud-on-surface-variant'}`}
              >
                <span className="material-symbols-outlined text-[22px]" style={active ? { fontVariationSettings: "'FILL' 1" } : undefined}>
                  {item.bottomIcon ?? item.icon}
                </span>
                {item.bottomLabel ?? item.label}
              </Link>
            );
          })}
          <button onClick={() => setPlusOpen(true)} className="flex flex-1 flex-col items-center justify-center gap-0.5 text-[11px] font-medium text-amud-on-surface-variant" aria-haspopup="menu" aria-expanded={plusOpen}>
            <span className="material-symbols-outlined text-[22px]">more_horiz</span>
            Plus
          </button>
        </nav>

        <Drawer open={plusOpen} onClose={() => setPlusOpen(false)} anchor="bottom" title="Plus d’options">
          <div className="flex flex-col gap-lg">
            {PLUS_GROUPS.map((group) => (
              <div key={group.label || 'root'}>
                {group.label ? <div className="px-1 pb-1 text-label-sm font-semibold uppercase tracking-wider text-amud-outline">{group.label}</div> : null}
                <div className="flex flex-col gap-0.5">
                  {group.items.map((item) => (
                    <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href)} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </Drawer>
      </div>
    </ToastProvider>
  );
}
