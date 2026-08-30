'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';
import { IconButton } from '@/components/shared/Button';

interface SiteHeaderProps {
  className?: string;
  /**
   * Fond glass à 15% d'opacité (+ flou) tant que le hero vidéo est visible,
   * ET position `fixed` (au lieu de `sticky`) pour flotter par-dessus le
   * hero vidéo dès le chargement plutôt que de réserver sa propre bande
   * opaque au-dessus — sans quoi le fond "transparent" ne montre que la
   * couleur de page (blanche) tant qu'on n'a pas scrollé. Dès que le scroll
   * dépasse la section `#hero-video-section`, le fond bascule vers un glass
   * sombre (bg-black + flou) pour rester lisible au-dessus du contenu clair
   * qui suit. Utilisé sur la landing page `/accueil-public` uniquement,
   * pour ne pas changer l'apparence/mise en page du header sur les autres
   * pages qui le partagent (`/produit`, `/employeurs`, `/metiers/[slug]`).
   */
  glassTransparent?: boolean;
}

const HEADER_HEIGHT_PX = 68;

/**
 * En-tête public moderne avec effet Glassmorphism transparent et flou d'arrière-plan.
 */
export function SiteHeader({ className = '', glassTransparent = false }: SiteHeaderProps) {
  const { nav } = useHomeContent();
  const [scrolled, setScrolled] = useState(false);
  const [pastHero, setPastHero] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Sur la landing (glassTransparent), le header reste très transparent tant
  // que le hero vidéo est visible, puis bascule en glass sombre dès que la
  // section défile hors de la zone couverte par le header — quel que soit
  // l'appareil (mobile/tablette/desktop), car on observe la position réelle
  // de la section plutôt qu'un seuil de scroll fixe.
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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={`${glassTransparent ? 'fixed' : 'sticky'} top-0 z-50 w-full transition-all duration-300 pt-[env(safe-area-inset-top)] ${glassTransparent
        ? pastHero || menuOpen
          ? 'border-b border-white/10 bg-black/55 shadow-[0_8px_32px_rgba(0,0,0,0.25)] backdrop-blur-2xl backdrop-saturate-150'
          : 'border-b border-white/10 dark:border-white/5 bg-white/15 dark:bg-surface/15 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150'
        : scrolled || menuOpen
          ? 'border-b border-white/40 dark:border-white/10 bg-white/75 dark:bg-surface/80 shadow-[0_8px_32px_rgba(0,0,0,0.08)] backdrop-blur-2xl backdrop-saturate-180'
          : 'border-b border-white/30 dark:border-white/10 bg-white/55 dark:bg-surface/60 shadow-[0_4px_24px_rgba(0,0,0,0.04)] backdrop-blur-xl backdrop-saturate-150'
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
              glassTransparent ? 'text-white' : 'text-primary-dark'
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
                glassTransparent ? 'text-white/90 hover:text-white' : 'text-onSurface-variant hover:text-primary'
              }`}
            >
              {link.label}
            </a>
          ))}
        </nav>

        {/* Action Controls & CTAs with Glassmorphism */}
        <div className="flex items-center gap-3">
          <div className="rounded-xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/10 backdrop-blur-md shadow-xs p-0.5">
            <div className="sm:hidden"><LanguageSwitcher compact /></div>
            <div className="hidden sm:block"><LanguageSwitcher /></div>
          </div>

          <div className="rounded-xl border border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/10 backdrop-blur-md shadow-xs">
            <ThemeToggle />
          </div>

          <Link
            href="/auth-phone"
            className={`hidden rounded-xl border px-3.5 py-2 text-sm font-bold transition-all duration-200 hover:scale-105 backdrop-blur-md shadow-xs sm:inline-flex ${
              glassTransparent
                ? 'border-white/30 bg-white/10 text-white hover:bg-white/25'
                : 'border-white/40 dark:border-white/10 bg-white/40 dark:bg-white/10 text-onSurface hover:bg-white/70 hover:text-primary'
            }`}
          >
            {nav.signIn}
          </Link>

          <PrimaryCta href="/auth-phone" size="sm" className="hidden lg:inline-flex shadow-soft">
            {nav.cta}
          </PrimaryCta>

          {/* Mobile Menu Hamburger */}
          <IconButton
            variant="ghost"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? nav.menuClose : nav.menuOpen}
            className={`rounded-xl border backdrop-blur-md lg:hidden ${
              glassTransparent
                ? 'border-white/30 bg-white/10 text-white'
                : 'border-white/50 dark:border-white/10 bg-white/40 dark:bg-white/10 text-onSurface'
            }`}
          >
            <span className="material-symbols-outlined" style={{ fontSize: 24 }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </IconButton>
        </div>
      </div>

      {/* Mobile Menu Drawer with Glassmorphism */}
      {menuOpen && (
        <div className="fixed inset-0 top-[calc(68px+env(safe-area-inset-top))] z-50 overflow-y-auto bg-white/35 dark:bg-surface/50 px-6 py-8 shadow-2xl backdrop-blur-3xl lg:hidden">
          <nav className="flex flex-col gap-2" aria-label="Navigation mobile">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="flex items-center justify-between rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-white/5 p-4 text-lg font-black text-onSurface shadow-xs backdrop-blur-md transition-all hover:border-primary hover:text-primary"
              >
                <span>{link.label}</span>
                <span className="material-symbols-outlined text-primary">arrow_forward</span>
              </a>
            ))}
          </nav>

          <div className="mt-8 space-y-3">
            <PrimaryCta href="/auth-phone" size="lg" className="w-full justify-center shadow-floating">
              {nav.cta}
            </PrimaryCta>
            <Link
              href="/auth-phone"
              onClick={() => setMenuOpen(false)}
              className="block rounded-2xl border border-white/50 dark:border-white/10 bg-white/60 dark:bg-white/5 py-4 text-center text-sm font-bold text-onSurface shadow-soft backdrop-blur-md"
            >
              {nav.signIn}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
