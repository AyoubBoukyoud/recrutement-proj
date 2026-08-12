'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { useHomeContent } from '@/lib/useLocalizedContent';
import { PrimaryCta } from './Cta';

/**
 * En-tête public.
 *
 * Le bouton d'action n'apparaît qu'une fois le Hero dépassé : au-dessus, il
 * ferait doublon avec le CTA du Hero, et deux boutons identiques à 200 pixels
 * l'un de l'autre diluent l'action au lieu de la renforcer.
 *
 * Le sélecteur de langue, lui, reste visible en permanence et hors du menu
 * mobile : un visiteur arabophone doit voir que le site lui parle avant même
 * de lire le titre.
 */
export function SiteHeader() {
  const { nav } = useHomeContent();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Un menu plein écran ouvert au-dessus d'une page qui défile encore derrière
  // est désorientant au doigt.
  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => {
      document.body.style.overflow = '';
    };
  }, [menuOpen]);

  return (
    <header
      className={`fixed inset-x-0 top-0 z-40 transition-colors duration-200 ${
        scrolled ? 'border-b border-outline-variant/40 bg-surface/95 shadow-soft backdrop-blur-md' : 'bg-transparent'
      }`}
    >
      <div className="mx-auto flex w-full max-w-[1280px] items-center gap-4 px-6 py-4 lg:px-12">
        <Link href="/" className="flex items-center gap-2 font-extrabold text-primary-dark">
          <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-9 w-9 object-contain" />
          <span className="whitespace-nowrap text-sm sm:text-base">Amud Skills</span>
        </Link>

        <nav className="ms-6 hidden items-center gap-6 lg:flex" aria-label="Navigation principale">
          {nav.links.map((link) => (
            <a
              key={link.href}
              href={link.href}
              className="text-sm font-semibold text-onSurface-variant transition-colors hover:text-primary"
            >
              {link.label}
            </a>
          ))}
        </nav>

        <div className="ms-auto flex items-center gap-3">
          <LanguageSwitcher />

          <Link
            href="/auth-phone"
            className="hidden text-sm font-semibold text-onSurface-variant transition-colors hover:text-primary sm:inline"
          >
            {nav.signIn}
          </Link>

          {scrolled && (
            <PrimaryCta href="/auth-phone" className="hidden lg:inline-flex">
              {nav.cta}
            </PrimaryCta>
          )}

          <button
            type="button"
            onClick={() => setMenuOpen((open) => !open)}
            aria-expanded={menuOpen}
            aria-label={menuOpen ? nav.menuClose : nav.menuOpen}
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-outline-variant bg-surface-lowest text-onSurface lg:hidden"
          >
            <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
              {menuOpen ? 'close' : 'menu'}
            </span>
          </button>
        </div>
      </div>

      {menuOpen && (
        <div className="fixed inset-0 top-[72px] z-40 overflow-y-auto bg-surface px-6 py-8 lg:hidden">
          <nav className="flex flex-col gap-1" aria-label="Navigation mobile">
            {nav.links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                onClick={() => setMenuOpen(false)}
                className="rounded-xl px-4 py-4 text-lg font-bold text-onSurface hover:bg-surface-container"
              >
                {link.label}
              </a>
            ))}
          </nav>

          <div className="mt-6 space-y-3">
            <PrimaryCta href="/auth-phone" size="lg" className="w-full">
              {nav.cta}
            </PrimaryCta>
            <Link
              href="/auth-phone"
              className="block rounded-xl border border-outline-variant py-4 text-center text-sm font-semibold text-onSurface"
            >
              {nav.signIn}
            </Link>
          </div>
        </div>
      )}
    </header>
  );
}
