'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { InertNavItem, NavItem, Toggle, isNavActive, useDropdown } from '@/components/amud/ui';
import { ToastProvider } from '@/components/amud/Toast';
import { DemoBanner } from '@/components/amud/DemoBanner';
import { CURRENT_EMPLOYER } from '@/data/amud/currentEmployer';
import { loadLocalApplications } from '@/lib/amud/localApplications';
import { loadLocalOffres } from '@/lib/amud/localOffres';
import { notificationsSeed } from '@/data/amud/notifications';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';

/** Coquille de `/amud/employer` (doc3: tableau_de_bord_employeur_desktop_restored.html). */
const NAV = [{ href: '/amud/employer', icon: 'dashboard', label: 'Dashboard' }];
const INERT: { icon: string; label: string; badge?: number }[] = [
  { icon: 'search', label: 'Search' },
  { icon: 'business_center', label: 'Jobs' },
  { icon: 'star', label: 'Shortlist' },
  { icon: 'group', label: 'Recruitment' },
  { icon: 'mail', label: 'Messages', badge: 3 },
];

type SearchResult = { id: string; label: string; sub: string; href: string; icon: string };

/** Recherche header réelle (façon `useGlobalSearchResults` d'AdminShell), bornée aux candidatures/offres de l'entreprise connectée. */
function useEmployerSearchResults(query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];

    const applications = loadLocalApplications().filter((a) => a.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const a of applications) {
      if (results.filter((r) => r.icon === 'person').length >= 4) break;
      if (a.candidateNom.toLowerCase().includes(q) || a.offerTitre.toLowerCase().includes(q)) {
        results.push({ id: `app-${a.id}`, label: a.candidateNom, sub: `Candidature · ${a.offerTitre}`, href: `/amud/employer?q=${encodeURIComponent(a.candidateNom)}`, icon: 'person' });
      }
    }

    const offres = loadLocalOffres().filter((o) => o.entrepriseId === CURRENT_EMPLOYER.entrepriseId);
    for (const o of offres) {
      if (results.filter((r) => r.icon === 'work').length >= 3) break;
      if (o.titre.toLowerCase().includes(q)) {
        results.push({ id: `off-${o.id}`, label: o.titre, sub: `Offre · ${o.statut}`, href: '/amud/employer', icon: 'work' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

export function EmployerShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  const notifMenu = useDropdown<HTMLDivElement>();
  const settingsMenu = useDropdown<HTMLDivElement>();
  const profileMenu = useDropdown<HTMLDivElement>();
  const searchMenu = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const employerNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'employer').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications],
  );
  const totalAlerts = employerNotifications.filter((n) => !n.read).length;
  const results = useEmployerSearchResults(query);

  useEffect(() => {
    setNavOpen(false);
    notifMenu.setOpen(false);
    settingsMenu.setOpen(false);
    profileMenu.setOpen(false);
    searchMenu.setOpen(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function goToResult(href: string) {
    searchMenu.setOpen(false);
    setQuery('');
    router.push(href);
  }

  return (
    <ToastProvider>
    <div className="min-h-screen overflow-x-hidden bg-amud-background text-amud-on-surface">
      {navOpen ? (
        <div
          className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`fixed left-0 top-0 z-40 flex h-full w-72 flex-col space-y-sm overflow-y-auto border-r border-amud-outline-variant bg-amud-surface-container-lowest p-md transition-transform duration-200 ease-in-out md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center gap-md px-sm py-md">
          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-amud-primary">
            <span className="material-symbols-outlined text-white">language</span>
          </div>
          <div>
            <h1 className="text-headline-md font-black tracking-tight text-amud-on-surface">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">B2B Recruitment Portal</p>
          </div>
        </div>
        <nav className="flex-1 space-y-1">
          <div className="mt-md px-sm py-xs text-[11px] font-bold uppercase tracking-wider text-amud-on-surface-variant">Main Navigation</div>
          {NAV.map((item) => (
            <NavItem key={item.href} href={item.href} icon={item.icon} label={item.label} active={isNavActive(pathname, item.href, true)} />
          ))}
          {INERT.map((item) => (
            <InertNavItem key={item.label} icon={item.icon} label={item.label} badge={item.badge} />
          ))}
        </nav>
        <div className="border-t border-amud-outline-variant pt-md" style={{ paddingBottom: 'max(0px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-center gap-md">
            <div className="h-10 w-10 shrink-0 overflow-hidden rounded-full bg-amud-surface-container-highest">
              <img
                className="h-full w-full object-cover"
                alt="Morocco-Germany Bridge"
                src="https://lh3.googleusercontent.com/aida-public/AB6AXuClLfIbrZoVx9Z8EJzQ_k_Jc6590oQ0YlFQZOGb1RvjQlVIxiyq0JuP5djxV8LAHgfdUjCDYm4XHku-Or4ZkzBvcsHJ5YRbZ4q8vNtK0LOvf6sZuGucTYIjShWPbcE5wrFZh4--rUOkV43nGiarLRMMbIjO8zPWcJwrnxyEGIOtlwP2D9jiWLpn2eiiE5Xjs6Uxl3-LuMdaOp6or5YrADUOTpnwKdycfNAyIWwSQRYtTPaJOoYftWOi"
              />
            </div>
            <div className="overflow-hidden">
              <p className="truncate text-label-md font-bold text-amud-on-surface">Morocco-Germany Bridge</p>
              <p className="truncate text-[12px] text-amud-on-surface-variant">Elite Recruiting Partner</p>
            </div>
          </div>
        </div>
      </aside>

      <main className="min-h-screen md:ml-72">
        <header className="sticky top-0 z-20 flex h-16 items-center gap-sm bg-amud-surface-container-lowest px-margin-mobile shadow-sm md:px-margin-desktop">
          <button
            onClick={() => setNavOpen(true)}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high hover:text-amud-primary md:hidden"
            aria-label="Ouvrir le menu"
          >
            <span className="material-symbols-outlined">menu</span>
          </button>
          <div className="hidden max-w-xl flex-1 items-center md:flex">
            <div ref={searchMenu.ref} className="relative w-full">
              <span className="material-symbols-outlined absolute left-md top-1/2 -translate-y-1/2 text-[20px] text-amud-on-surface-variant">search</span>
              <input
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  searchMenu.setOpen(true);
                }}
                onFocus={() => searchMenu.setOpen(true)}
                className="w-full rounded-full border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-xl pr-md text-label-md text-amud-on-surface outline-none transition-all focus:ring-2 focus:ring-amud-primary focus:ring-offset-2"
                placeholder="Quick search for candidates or jobs…"
                aria-label="Quick search for candidates or jobs"
                type="text"
              />
              {searchMenu.open && query.trim().length >= 2 ? (
                <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  {results.length === 0 ? (
                    <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
                  ) : (
                    results.map((r) => (
                      <button
                        key={r.id}
                        onClick={() => goToResult(r.href)}
                        className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low"
                      >
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
          </div>
          <button
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high md:hidden"
            aria-label="Rechercher"
          >
            <span className="material-symbols-outlined">search</span>
          </button>
          <div className="ml-auto flex items-center gap-sm md:gap-lg">
            <div ref={notifMenu.ref} className="relative">
              <button
                onClick={() => notifMenu.setOpen((v) => !v)}
                className="relative rounded-full p-sm transition-colors hover:bg-amud-surface-container-high"
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={notifMenu.open}
              >
                <span className="material-symbols-outlined text-amud-on-surface-variant">notifications</span>
                {totalAlerts > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amud-secondary px-1 text-[10px] font-bold text-white">
                    {totalAlerts}
                  </span>
                ) : null}
              </button>
              {notifMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                    <span>Notifications</span>
                    {totalAlerts > 0 ? (
                      <button onClick={() => markAllNotificationsRead('employer')} className="text-label-sm font-normal text-amud-primary hover:underline">
                        Tout marquer comme lu
                      </button>
                    ) : null}
                  </div>
                  <div className="flex max-h-96 flex-col overflow-y-auto">
                    {employerNotifications.length === 0 ? (
                      <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
                    ) : (
                      employerNotifications.slice(0, 10).map((n) => (
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
                </div>
              ) : null}
            </div>
            <div ref={settingsMenu.ref} className="relative hidden sm:block">
              <button
                onClick={() => settingsMenu.setOpen((v) => !v)}
                className="rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-high"
                aria-label="Réglages"
                aria-haspopup="menu"
                aria-expanded={settingsMenu.open}
              >
                <span className="material-symbols-outlined">settings</span>
              </button>
              {settingsMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-72 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                    Réglages rapides
                  </div>
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
            <div className="hidden h-8 w-[1px] bg-amud-outline-variant sm:block" />
            <div ref={profileMenu.ref} className="relative">
              <button
                onClick={() => profileMenu.setOpen((v) => !v)}
                className="flex h-9 w-9 items-center justify-center overflow-hidden rounded-full bg-amud-primary text-sm font-bold text-white transition-opacity hover:opacity-90"
                aria-label="Menu du compte"
                aria-haspopup="menu"
                aria-expanded={profileMenu.open}
              >
                M
              </button>
              {profileMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                    <div className="text-label-md font-semibold text-amud-on-surface">Morocco-Germany Bridge</div>
                    <div className="text-label-sm text-amud-on-surface-variant">Elite Recruiting Partner</div>
                  </div>
                  <div className="flex flex-col py-1">
                    <Link
                      href="/amud"
                      onClick={() => profileMenu.setOpen(false)}
                      className="flex items-center gap-sm px-md py-sm text-label-md text-amud-on-surface transition-colors hover:bg-amud-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">apps</span> Changer d&apos;espace
                    </Link>
                    <Link
                      href="/amud"
                      onClick={() => profileMenu.setOpen(false)}
                      className="flex items-center gap-sm px-md py-sm text-label-md text-amud-error transition-colors hover:bg-amud-surface-container-low"
                    >
                      <span className="material-symbols-outlined text-[18px]">logout</span> Déconnexion
                    </Link>
                  </div>
                </div>
              ) : null}
            </div>
            <button className="flex items-center gap-xs whitespace-nowrap rounded-lg bg-amud-primary px-sm py-sm font-label-md text-white shadow-sm transition-all hover:brightness-110 active:scale-95 sm:px-md">
              <span className="material-symbols-outlined text-[18px] text-white">add</span>
              <span className="hidden sm:inline">New Job</span>
            </button>
          </div>
        </header>
        <div className="mx-auto max-w-7xl space-y-xl p-margin-mobile md:p-margin-desktop">
          <DemoBanner />
          {children}
        </div>
      </main>
    </div>
    </ToastProvider>
  );
}
