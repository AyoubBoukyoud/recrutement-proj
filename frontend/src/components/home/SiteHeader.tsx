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
export function SiteHeader({ className = '' }: SiteHeaderProps) {
  const content = useHomeContent();
  const { nav } = content;
  const { language } = useLanguage();
  const pathname = usePathname();
  const [scrolled, setScrolled] = useState(false);
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
        className={`sticky top-0 z-50 w-full border-b border-black/5 pt-[env(safe-area-inset-top)] backdrop-blur-xl backdrop-saturate-150 transition-all duration-300 dark:border-[#303641] ${
          scrolled || menuOpen
            ? 'bg-white/90 shadow-[0_8px_32px_rgba(0,0,0,0.08)] dark:bg-[#101216]/95'
            : 'bg-white/75 dark:bg-[#101216]/90'
        } ${className}`}
      >
        <div className="mx-auto flex h-[68px] w-full max-w-[1360px] items-center justify-between gap-4 px-6 lg:px-12">
          {/* Logo and Brand */}
          <Link href="/accueil-public" className="group flex items-center gap-2.5">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 dark:from-[#8fb5a1] dark:to-[#4c6e5d] p-1 shadow-sm ring-1 ring-white/40 transition-transform duration-200 group-hover:scale-105">
              <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-contain" />
            </div>
            <span className="text-base font-bold tracking-tight text-primary-dark transition-colors duration-200 dark:text-[#f3f4f6] sm:text-lg">
              Amud Skills
            </span>
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden items-center gap-7 lg:flex" aria-label="Navigation principale">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="text-sm font-semibold text-onSurface-variant transition-colors duration-200 hover:text-primary"
              >
                {link.label}
              </a>
            ))}
          </nav>

          {/* Action Controls & CTAs */}
          <div className="flex items-center gap-2.5">
            <div className="rounded-xl border border-black/10 dark:border-[#303641] bg-white/50 dark:bg-[#1d2129] backdrop-blur-md shadow-xs p-0.5">
              <div className="sm:hidden"><LanguageSwitcher compact /></div>
              <div className="hidden sm:block"><LanguageSwitcher /></div>
            </div>

            <div className="rounded-xl border border-black/10 dark:border-[#303641] bg-white/50 dark:bg-[#1d2129] backdrop-blur-md shadow-xs">
              <ThemeToggle />
            </div>

            <Link
              href="/auth-phone"
              className="hidden rounded-xl border border-black/10 bg-white/50 px-3.5 py-2 text-sm font-semibold text-onSurface backdrop-blur-md transition-colors duration-200 hover:bg-white/80 hover:text-primary dark:border-[#303641] dark:bg-[#1d2129] dark:hover:bg-[#252a34] sm:inline-flex"
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
                  ? 'rotate-90 border-primary/40 bg-primary/15 text-primary'
                  : 'border-black/10 bg-white/50 text-onSurface dark:border-[#303641] dark:bg-[#1d2129]'
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
              <div className="fixed top-[calc(68px+env(safe-area-inset-top))] inset-x-0 bottom-0 overflow-y-auto bg-white/98 dark:bg-[#101216] dark:text-[#f3f4f6] backdrop-blur-3xl border-t border-black/10 dark:border-[#303641] shadow-2xl animate-menu-drawer-in motion-reduce:animate-none flex flex-col justify-between p-5 pb-[calc(28px+env(safe-area-inset-bottom))]">
                <div className="space-y-6">
                  {/* Eyebrow / Tag */}
                  <div className="border-b border-black/5 pb-3 dark:border-[#303641]">
                    <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">
                      {content.hero.eyebrow}
                    </span>
                  </div>

                  {/* Navigation Links Cards */}
                  <nav className="flex flex-col gap-2.5" aria-label="Navigation mobile">
                    {nav.links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className="group flex items-center justify-between rounded-2xl border border-black/5 dark:border-[#303641] bg-slate-50/90 dark:bg-[#1d2129] p-4 text-base font-black text-onSurface dark:text-[#f3f4f6] shadow-xs backdrop-blur-md transition-all hover:border-primary/50 hover:bg-white dark:hover:bg-[#252a34] active:scale-[0.98]"
                      >
                        <div className="flex items-center gap-3.5">
                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/15 text-emerald-700 dark:bg-[#8fb5a1]/10 dark:text-[#8fb5a1] transition-transform group-hover:scale-110">
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
                  <div className="flex items-center justify-between rounded-2xl border border-black/5 dark:border-[#303641] bg-slate-50/80 dark:bg-[#1d2129] p-3 px-4">
                    <span className="text-xs font-bold text-onSurface-variant dark:text-[#bbc1cc] flex items-center gap-2">
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
                <div className="mt-8 space-y-4 pt-4 border-t border-black/5 dark:border-[#303641]">
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
                    className="flex items-center justify-center gap-2 rounded-2xl border border-black/10 dark:border-[#303641] bg-slate-50/90 dark:bg-[#1d2129] py-3.5 text-center text-sm font-bold text-onSurface dark:text-[#f3f4f6] shadow-xs backdrop-blur-md active:scale-[0.98] transition-all hover:border-primary/40 hover:text-primary"
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
