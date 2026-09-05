'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';
import { IconButton } from '@/components/shared/Button';

interface SiteHeaderProps {
  className?: string;
  /**
   * À partir de `sm` (≥640px, tablette/desktop) : le header passe en
   * position `fixed` et flotte par-dessus le hero vidéo avec un fond glass
   * à 15% d'opacité (+ flou) tant que la vidéo est visible, puis bascule
   * vers un glass sombre (bg-black + flou) dès que le scroll dépasse la
   * section `#hero-video-section` — pour rester lisible au-dessus du
   * contenu clair qui suit.
   * En dessous de `sm` (mobile) : le header reste `sticky` dans le flux
   * normal, avec l'apparence opaque standard (comme sur les autres pages),
   * afin de précéder la vidéo au lieu de se superposer dessus.
   * Utilisé sur la landing page `/accueil-public` uniquement, pour ne pas
   * changer l'apparence/mise en page du header sur les autres pages qui le
   * partagent (`/produit`, `/employeurs`, `/metiers/[slug]`).
   */
  glassTransparent?: boolean;
}

const HEADER_HEIGHT_PX = 68;
const MOBILE_MENU_ID = 'site-mobile-menu';

// Icon mapping for navigation links based on href
function getNavLinkIcon(href: string): string {
  if (href.includes('#sectors') || href.includes('metiers')) return 'category';
  if (href.includes('#methodology') || href.includes('marche')) return 'alt_route';
  if (href.includes('employeur') || href.includes('recruteur')) return 'corporate_fare';
  if (href.includes('produit')) return 'devices';
  return 'explore';
}

const PREFERENCES_LABELS: Record<string, string> = {
  fr: 'Langue & Thème',
  ar: 'اللغة والمظهر',
  en: 'Language & Theme',
  de: 'Sprache & Design',
};

/**
 * En-tête public moderne avec effet Glassmorphism transparent et flou d'arrière-plan.
 * Le menu mobile est monté via un React Portal directement dans le document.body pour
 * éviter que le backdrop-filter du header ne crée un containing block qui écrase le drawer.
 */
export function SiteHeader({ className = '', glassTransparent = false }: SiteHeaderProps) {
  const content = useHomeContent();
  const { nav } = content;
  const { language } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const menuButtonRef = useRef<HTMLButtonElement>(null);
  const menuPanelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 30);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sur la landing (glassTransparent), à partir de `sm` le header reste très
  // transparent tant que le hero vidéo est visible, puis bascule en glass
  // sombre dès que la section défile hors de la zone couverte par le header.
  useEffect(() => {
    if (!glassTransparent) return;
    const heroEl = document.getElementById('hero-video-section');
    if (!heroEl) return;

    const observer = new IntersectionObserver(
      ([entry]) => setPastHero(!entry.isIntersecting),
      { rootMargin: `-${HEADER_HEIGHT_PX}px 0px 0px 0px`, threshold: 0 }
    );
    observer.observe(heroEl);
    return () => observer.disconnect();
  }, [glassTransparent]);

  // Lock scroll when mobile menu is open
  useEffect(() => {
    if (menuOpen) {
      const originalOverflow = document.body.style.overflow;
      document.body.style.overflow = 'hidden';
      return () => {
        document.body.style.overflow = originalOverflow;
      };
    }
  }, [menuOpen]);

  // Le tiroir mobile se comporte comme une boîte de dialogue modale : Echap
  // le referme, le focus part sur son premier lien puis y reste piégé, et
  // revient sur le bouton hamburger à la fermeture.
  useEffect(() => {
    if (!menuOpen) return;

    const panel = menuPanelRef.current;
    const focusable = panel?.querySelectorAll<HTMLElement>(
      'a[href], button:not([disabled])',
    );
    focusable?.[0]?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        event.preventDefault();
        setMenuOpen(false);
        return;
      }
      if (event.key !== 'Tab' || !focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener('keydown', onKeyDown);
    const trigger = menuButtonRef.current;
    return () => {
      document.removeEventListener('keydown', onKeyDown);
      trigger?.focus();
    };
  }, [menuOpen]);

  // Close menu on route change
  useEffect(() => {
    setMenuOpen(false);
  }, [pathname]);

  // Handle smooth scroll or navigation for mobile menu links
  const handleNavClick = useCallback(
    (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
      setMenuOpen(false);

      if (href.includes('#')) {
        const [path, hash] = href.split('#');
        const isCurrentPage =
          !path ||
          pathname === path ||
          (pathname === '/' && path === '/accueil-public') ||
          (pathname === '/accueil-public' && path === '/');

        if (isCurrentPage && hash) {
          e.preventDefault();
          const target = document.getElementById(hash);
          if (target) {
            const yOffset = -HEADER_HEIGHT_PX;
            const y = target.getBoundingClientRect().top + window.pageYOffset + yOffset;
            window.scrollTo({ top: y, behavior: 'smooth' });
          } else {
            window.location.hash = hash;
          }
        }
      }
    },
    [pathname]
  );

  return (
    <>
      <header
        className={`${glassTransparent ? 'sticky sm:fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-300 pt-[env(safe-area-inset-top)] ${
          glassTransparent
            ? scrolled || menuOpen
              ? 'border-b border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#12100e]/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-180'
              : 'border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12100e]/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150'
            : scrolled || menuOpen
            ? 'border-b border-black/5 dark:border-white/10 bg-white/85 dark:bg-[#12100e]/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-180'
            : 'border-b border-black/5 dark:border-white/10 bg-white/70 dark:bg-[#12100e]/70 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150'
        } ${
          glassTransparent && (pastHero || menuOpen)
            ? 'sm:border-white/10 sm:bg-black/60 sm:shadow-[0_8px_32px_rgba(0,0,0,0.3)] sm:backdrop-blur-2xl sm:backdrop-saturate-150'
            : glassTransparent
            ? 'sm:border-white/10 sm:dark:border-white/5 sm:bg-white/15 sm:dark:bg-black/25 sm:shadow-[0_4px_24px_rgba(0,0,0,0.04)] sm:backdrop-blur-xl sm:backdrop-saturate-150'
            : ''
        } ${className}`}
      >
        <div className="mx-auto flex h-[68px] w-full max-w-[1360px] items-center justify-between gap-4 px-6 lg:px-12">
          {/* Logo and Brand */}
          <Link href="/accueil-public" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-1 shadow-sm ring-1 ring-white/40 transition-transform duration-200 group-hover:scale-105">
              <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-contain" />
            </div>
            <span
              className={`text-base font-black tracking-tight transition-colors duration-200 sm:text-lg ${
                glassTransparent
                  ? pastHero
                    ? 'text-primary-dark dark:text-white'
                    : 'text-primary-dark sm:text-white'
                  : 'text-primary-dark dark:text-white'
              }`}
            >
              Amud Skills
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className={`text-sm font-bold transition-all duration-200 hover:-translate-y-0.5 ${
                  glassTransparent && !pastHero
                    ? 'text-white/90 hover:text-white'
                    : 'text-onSurface-variant hover:text-primary'
                }`}
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Controls & CTAs */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 backdrop-blur-md shadow-xs p-0.5">
              <div className="sm:hidden"><LanguageSwitcher compact /></div>
              <div className="hidden sm:block"><LanguageSwitcher /></div>
            </div>

            <div className="rounded-xl border border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 backdrop-blur-md shadow-xs">
              <ThemeToggle />
            </div>

            <Link
              href="/auth-phone"
              className={`hidden rounded-xl border px-3.5 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 backdrop-blur-md shadow-xs sm:inline-flex ${
                glassTransparent && !pastHero
                  ? 'border-white/30 bg-white/10 text-white hover:bg-white/25'
                  : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 text-onSurface hover:bg-white/80 hover:text-primary'
              }`}
            >
              {nav.signIn}
            </Link>

            <PrimaryCta href="/auth-phone" size="sm" className="hidden lg:inline-flex shadow-soft">
              {nav.cta}
            </PrimaryCta>

            {/* Mobile Menu Hamburger Button */}
            <IconButton
              ref={menuButtonRef}
              variant="ghost"
              onClick={() => setMenuOpen((open) => !open)}
              aria-expanded={menuOpen}
              aria-controls={MOBILE_MENU_ID}
              aria-label={menuOpen ? nav.menuClose : nav.menuOpen}
              className={`rounded-xl border backdrop-blur-md transition-all duration-200 lg:hidden ${
                menuOpen
                  ? 'border-primary/40 bg-primary/15 text-primary rotate-90'
                  : glassTransparent && !pastHero
                  ? 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 text-onSurface sm:border-white/30 sm:bg-white/10 sm:text-white'
                  : 'border-black/10 dark:border-white/10 bg-white/50 dark:bg-white/10 text-onSurface'
              }`}
            >
              <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
                {menuOpen ? 'close' : 'menu'}
              </span>
            </IconButton>
          </div>
        </div>
      </header>

      {/* Mobile Navigation Drawer rendered via Portal outside the header containing block */}
      {mounted && menuOpen
        ? createPortal(
            <div
              id={MOBILE_MENU_ID}
              ref={menuPanelRef}
              className="fixed inset-0 z-[100] lg:hidden"
              role="dialog"
              aria-modal="true"
              aria-label={nav.menuOpen}
            >
              {/* Semi-transparent backdrop */}
              <div
                className="fixed inset-0 bg-black/60 dark:bg-black/80 backdrop-blur-xs animate-amud-fade-in motion-reduce:animate-none"
                onClick={() => setMenuOpen(false)}
                aria-hidden="true"
              />

              {/* Drawer Container positioned directly below the header */}
              <div className="fixed top-[calc(68px+env(safe-area-inset-top))] inset-x-0 bottom-0 overflow-y-auto bg-white/98 dark:bg-[#161311] dark:text-[#e5e2e1] backdrop-blur-3xl border-t border-black/10 dark:border-white/10 shadow-2xl animate-menu-drawer-in motion-reduce:animate-none flex flex-col justify-between p-5 pb-[calc(28px+env(safe-area-inset-bottom))]">
                <div className="space-y-6">
                  {/* Eyebrow / Tag */}
                  <div className="flex items-center justify-between border-b border-black/5 dark:border-white/10 pb-3">
                    <span className="text-[11px] font-black uppercase tracking-wider text-primary">
                      🇲🇦 Maroc → 🇩🇪 Allemagne
                    </span>
                    <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-700 dark:text-emerald-400">
                      <span className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
                      100% Gratuit
                    </span>
                  </div>

                  {/* Navigation Links Cards */}
                  <nav className="flex flex-col gap-2.5" aria-label="Navigation mobile">
                    {nav.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className="group flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/10 bg-slate-50/90 dark:bg-[#221d1a] p-4 text-base font-black text-onSurface dark:text-white shadow-xs backdrop-blur-md transition-all hover:border-primary/50 hover:bg-white dark:hover:bg-[#2c2622] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:text-emerald-400 transition-transform group-hover:scale-110">
                            <span className="material-symbols-outlined text-xl">
                              {getNavLinkIcon(link.href)}
                            </span>
                          </div>
                          <span className="text-base font-black tracking-tight">{link.label}</span>
                        </div>
                        <span className="material-symbols-outlined text-primary text-xl rtl:rotate-180 transition-transform group-hover:translate-x-1 rtl:group-hover:-translate-x-1">
                          arrow_forward
                        </span>
                      </a>
                    ))}
                  </nav>

                  {/* Quick Preferences Bar in Drawer */}
                  <div className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-white/10 bg-slate-50/80 dark:bg-[#221d1a] p-3 px-4">
                    <span className="text-xs font-bold text-onSurface-variant dark:text-zinc-300 flex items-center gap-2">
                      <span className="material-symbols-outlined text-base text-primary">tune</span>
                      {PREFERENCES_LABELS[language] ?? PREFERENCES_LABELS.fr}
                    </span>
                    <div className="flex items-center gap-2">
                      <LanguageSwitcher />
                      <ThemeToggle />
                    </div>
                  </div>
                </div>

                {/* Bottom Actions & Trust */}
                <div className="mt-8 space-y-4 pt-4 border-t border-black/5 dark:border-white/10">
                  <PrimaryCta
                    href="/auth-phone"
                    size="lg"
                    className="w-full justify-center shadow-floating py-4 text-base"
                  >
                    <span className="flex items-center gap-2">
                      <span>{nav.cta}</span>
                      <span className="material-symbols-outlined text-lg rtl:rotate-180">arrow_forward</span>
                    </span>
                  </PrimaryCta>

                  <Link
                    href="/auth-phone"
                    onClick={() => setMenuOpen(false)}
                    className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-white/10 bg-slate-50/90 dark:bg-[#221d1a] py-3.5 text-center text-sm font-bold text-onSurface dark:text-white shadow-xs backdrop-blur-md active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary"
                  >
                    <span className="material-symbols-outlined text-lg text-primary">login</span>
                    <span>{nav.signIn}</span>
                  </Link>

                  <p className="text-center text-[11px] font-medium text-outline">
                    {content.hero.microcopy}
                  </p>
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </>
  );
}
