'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { ReactNode, useEffect, useMemo, useState } from 'react';
import { InertNavItem, NavItem, Toggle, isNavActive, useDropdown } from '@/components/amud/ui';
import { ToastProvider } from '@/components/amud/Toast';
import { CURRENT_COMMERCIAL } from '@/data/amud/currentCommercial';
import { loadLocalEntreprises } from '@/lib/amud/localEntreprises';
import { loadLocalMesContacts } from '@/lib/amud/localMesContacts';
import { loadLocalTaches } from '@/lib/amud/localCommercialTaches';
import { notificationsSeed } from '@/data/amud/notifications';
import { notifications as notificationsCollection, markNotificationRead, markAllNotificationsRead } from '@/lib/amud/storage/notify';
import { useCollection } from '@/lib/amud/storage/useCollection';

/**
 * Coquille des pages `/amud/commercial/*` — espace self-service d'un
 * commercial (doc19 espace_de_travail_quotidien_commercial.html,
 * doc8 mes_rendez_vous_crm_commercial_annotated.html, et la fusion
 * doc10/doc16 pour les contacts). Nav alignée sur doc8, la seule maquette
 * du lot construite explicitement pour le self-service (Overview/Calendar/
 * Companies/Contacts/Tasks) plutôt que sur le sidebar générique "Commercial
 * Agents" recopié par erreur dans doc19/doc10/doc16.
 *
 * Entreprises / Activités / Tâches sont passées de `InertNavItem` (pas
 * encore livrées) à de vrais liens le jour où ces 3 pages ont été
 * construites — Candidats/Performance/Notifications/Profile restent inertes
 * : ce ne sont pas des pages de ce lot de travail.
 */
const NAV = [
  { href: '/amud/commercial', icon: 'dashboard', label: 'Vue d’ensemble' },
  { href: '/amud/commercial/entreprises', icon: 'domain', label: 'Entreprises' },
  { href: '/amud/commercial/activites', icon: 'history', label: 'Activités' },
  { href: '/amud/commercial/taches', icon: 'assignment', label: 'Tâches' },
  { href: '/amud/commercial/rendez-vous', icon: 'calendar_month', label: 'Rendez-vous' },
  { href: '/amud/commercial/contacts', icon: 'group', label: 'Contacts' },
];
const INERT = [
  { icon: 'person', label: 'Candidats' },
  { icon: 'trending_up', label: 'Performance' },
  { icon: 'notifications', label: 'Notifications' },
  { icon: 'account_circle', label: 'Profile' },
];

type SearchResult = { id: string; label: string; sub: string; href: string; icon: string };

/** Recherche header réelle (façon `useGlobalSearchResults` d'AdminShell), bornée aux entreprises/contacts/tâches du commercial connecté. */
function useCommercialSearchResults(query: string): SearchResult[] {
  return useMemo(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];
    const results: SearchResult[] = [];

    for (const e of loadLocalEntreprises()) {
      if (results.filter((r) => r.sub === 'Entreprise').length >= 3) break;
      if (e.nom.toLowerCase().includes(q)) {
        results.push({ id: `ent-${e.id}`, label: e.nom, sub: 'Entreprise', href: `/amud/commercial/entreprises/${e.id}`, icon: 'domain' });
      }
    }
    for (const c of loadLocalMesContacts()) {
      if (results.filter((r) => r.sub === 'Contact').length >= 3) break;
      if (c.nom.toLowerCase().includes(q) || c.poste.toLowerCase().includes(q)) {
        results.push({ id: `con-${c.id}`, label: c.nom, sub: 'Contact', href: `/amud/commercial/contacts?q=${encodeURIComponent(c.nom)}`, icon: 'group' });
      }
    }
    for (const t of loadLocalTaches().filter((t) => t.commercialId === CURRENT_COMMERCIAL.id)) {
      if (results.filter((r) => r.sub === 'Tâche').length >= 3) break;
      if (t.titre.toLowerCase().includes(q)) {
        results.push({ id: `tac-${t.id}`, label: t.titre, sub: 'Tâche', href: `/amud/commercial/taches?open=${t.id}`, icon: 'assignment' });
      }
    }

    return results.slice(0, 8);
  }, [query]);
}

export function CommercialShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [navOpen, setNavOpen] = useState(false);
  // Rail réduite (icônes seules) sur desktop, dépliée au survol — indépendante
  // du tiroir mobile `navOpen` ci-dessus, qui reste un panneau plein écran.
  const [collapsed, setCollapsed] = useState(false);
  const notifMenu = useDropdown<HTMLDivElement>();
  const settingsMenu = useDropdown<HTMLDivElement>();
  const profileMenu = useDropdown<HTMLDivElement>();
  const searchMenu = useDropdown<HTMLDivElement>();
  const [query, setQuery] = useState('');
  const [emailNotif, setEmailNotif] = useState(true);
  const [pushNotif, setPushNotif] = useState(true);

  const [allNotifications] = useCollection(notificationsCollection, notificationsSeed);
  const commercialNotifications = useMemo(
    () => allNotifications.filter((n) => n.scope === 'commercial').sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
    [allNotifications],
  );
  const totalAlerts = commercialNotifications.filter((n) => !n.read).length;
  const results = useCommercialSearchResults(query);

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

  const hiddenWhenCollapsed = collapsed ? 'md:hidden md:group-hover:block' : '';

  return (
    <ToastProvider>
    <div className="amud-ops-scale flex min-h-screen bg-amud-background text-amud-on-background">
      {navOpen ? (
        <div
          className="fixed inset-0 z-30 bg-amud-on-surface/40 md:hidden"
          onClick={() => setNavOpen(false)}
          aria-hidden="true"
        />
      ) : null}
      <aside
        className={`group fixed left-0 top-0 z-40 flex h-screen w-64 flex-col gap-base border-r border-amud-outline-variant bg-amud-surface-container px-md py-lg transition-[width,transform] duration-200 ease-in-out md:translate-x-0 ${
          navOpen ? 'translate-x-0' : '-translate-x-full'
        } ${collapsed ? 'md:w-20 md:px-2 md:hover:w-64 md:hover:px-md' : 'md:w-64'}`}
      >
        <div className="mb-xl flex items-center gap-md px-sm">
          <img src="/assets/images/logo.png" alt="" className="h-10 w-10 shrink-0 object-contain" />
          <div className={hiddenWhenCollapsed}>
            <h1 className="text-title-lg font-black text-amud-primary">Amud Skills</h1>
            <p className="text-label-sm text-amud-on-surface-variant">Espace Commercial</p>
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-sm overflow-y-auto">
          {NAV.map((item) => (
            <NavItem
              key={item.href}
              href={item.href}
              icon={item.icon}
              label={item.label}
              active={isNavActive(pathname, item.href, item.href === '/amud/commercial')}
              collapsed={collapsed}
            />
          ))}
          {INERT.map((item) => (
            <InertNavItem key={item.label} icon={item.icon} label={item.label} collapsed={collapsed} />
          ))}
        </div>

        <div className="flex flex-col gap-sm border-t border-amud-outline-variant pt-4">
          <Link
            href="/amud"
            className="flex items-center gap-3 rounded-lg px-3 py-2 text-label-md text-amud-on-surface-variant transition-colors hover:bg-amud-surface-variant"
            title={collapsed ? "Changer d'espace" : undefined}
          >
            <span className="material-symbols-outlined shrink-0">apps</span>
            <span className={collapsed ? 'md:hidden md:group-hover:inline' : ''}>Changer d&apos;espace</span>
          </Link>
        </div>
      </aside>

      <div
        className={`flex min-h-screen min-w-0 flex-1 flex-col transition-[margin] duration-200 ease-in-out ${
          collapsed ? 'md:ml-20' : 'md:ml-64'
        }`}
      >
        <header className="sticky top-0 z-20 flex h-16 w-full items-center justify-between border-b border-amud-outline-variant bg-amud-surface px-md md:px-lg">
          <div className="flex items-center gap-1">
            <button
              onClick={() => setNavOpen(true)}
              className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:hidden"
              aria-label="Ouvrir le menu"
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
            <button
              onClick={() => setCollapsed((c) => !c)}
              className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-full text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary md:flex"
              aria-label={collapsed ? 'Développer le menu' : 'Réduire le menu'}
              aria-pressed={collapsed}
            >
              <span className="material-symbols-outlined">menu</span>
            </button>
          </div>
          <div ref={searchMenu.ref} className="relative hidden w-64 md:block">
            <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">search</span>
            <input
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                searchMenu.setOpen(true);
              }}
              onFocus={() => searchMenu.setOpen(true)}
              className="w-full rounded-lg border-none bg-amud-surface-container-low py-2 pl-10 pr-4 text-body-md outline-none focus:ring-2 focus:ring-amud-primary"
              placeholder="Rechercher…"
              aria-label="Rechercher"
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
          <div className="ml-auto flex items-center gap-2 md:gap-4">
            <div ref={notifMenu.ref} className="relative">
              <button
                onClick={() => notifMenu.setOpen((v) => !v)}
                className="relative rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
                aria-label="Notifications"
                aria-haspopup="menu"
                aria-expanded={notifMenu.open}
              >
                <span className="material-symbols-outlined">notifications</span>
                {totalAlerts > 0 ? (
                  <span className="absolute right-1 top-1 flex h-4 min-w-[16px] items-center justify-center rounded-full bg-amud-error px-1 text-[10px] font-bold text-white">
                    {totalAlerts}
                  </span>
                ) : null}
              </button>
              {notifMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-80 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="flex items-center justify-between border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm text-label-md font-semibold text-amud-on-surface">
                    <span>Notifications</span>
                    {totalAlerts > 0 ? (
                      <button onClick={() => markAllNotificationsRead('commercial')} className="text-label-sm font-normal text-amud-primary hover:underline">
                        Tout marquer comme lu
                      </button>
                    ) : null}
                  </div>
                  <div className="flex max-h-96 flex-col overflow-y-auto">
                    {commercialNotifications.length === 0 ? (
                      <p className="px-md py-lg text-center text-label-sm text-amud-on-surface-variant">Aucune notification.</p>
                    ) : (
                      commercialNotifications.slice(0, 10).map((n) => (
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
                className="rounded-full p-sm text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary"
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
            <div ref={profileMenu.ref} className="relative">
              <button
                onClick={() => profileMenu.setOpen((v) => !v)}
                className="flex h-8 w-8 items-center justify-center overflow-hidden rounded-full border border-amud-outline-variant bg-amud-primary-container text-sm font-bold text-white transition-opacity hover:opacity-90"
                aria-label="Menu du compte"
                aria-haspopup="menu"
                aria-expanded={profileMenu.open}
              >
                {CURRENT_COMMERCIAL.initiales}
              </button>
              {profileMenu.open ? (
                <div className="absolute right-0 top-full z-40 mt-2 w-56 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
                  <div className="border-b border-amud-outline-variant bg-amud-surface-container-low px-md py-sm">
                    <div className="text-label-md font-semibold text-amud-on-surface">{CURRENT_COMMERCIAL.nom}</div>
                    <div className="text-label-sm text-amud-on-surface-variant">Espace Commercial</div>
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
          </div>
        </header>
        <main className="mx-auto w-full max-w-[1200px] flex-1 p-md md:p-lg lg:p-margin-desktop">{children}</main>
      </div>
    </div>
    </ToastProvider>
  );
}
