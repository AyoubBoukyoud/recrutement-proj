'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';

/**
 * Coquille commune aux 3 pages marketing publiques `/amud/marketing/*`
 * (accueil, employeurs, produit — portées depuis 3 maquettes indépendantes).
 * Nav + footer identiques sur les 3 pour qu'elles se lisent comme un même
 * mini-site plutôt que 3 pages isolées ; seul le lien nav actif change.
 */

export type MarketingNavKey = 'home' | 'employers' | 'product' | null;

const NAV_LINKS: { key: MarketingNavKey; href: string; label: string }[] = [
  { key: 'home', href: '/amud/marketing/home#sectors', label: 'Sectors' },
  { key: 'home', href: '/amud/marketing/home#methodology', label: 'Methodology' },
  { key: 'employers', href: '/amud/marketing/employers#statistics', label: 'Statistics' },
  { key: null, href: '#', label: 'Testimonials' },
];

/** Toast léger pour les actions de maquette sans backend (Login, sélecteur de langue…). */
export function useMarketingToast() {
  const [notice, setNotice] = useState<string | null>(null);
  useEffect(() => {
    if (!notice) return;
    const t = setTimeout(() => setNotice(null), 2200);
    return () => clearTimeout(t);
  }, [notice]);
  return { notice, notify: setNotice };
}

export function MarketingToast({ notice }: { notice: string | null }) {
  if (!notice) return null;
  return (
    <div className="fixed bottom-6 right-6 z-[60] flex items-center gap-2 rounded-lg border border-amud-primary-fixed-dim bg-amud-surface-container-lowest px-4 py-3 text-body-md text-amud-on-surface shadow-lg">
      <span className="material-symbols-outlined fill text-amud-primary">info</span>
      {notice}
    </div>
  );
}

export function MarketingNav({ active, onDeadAction }: { active: MarketingNavKey; onDeadAction: (label: string) => void }) {
  return (
    <nav className="sticky top-0 z-50 w-full border-b border-amud-primary/10 bg-amud-surface/90 backdrop-blur-md">
      <div className="mx-auto flex h-20 max-w-container-max items-center justify-between px-margin-mobile md:px-gutter">
        <Link href="/amud/marketing/home" className="text-headline-md text-amud-primary">
          Amud Skills
        </Link>
        <ul className="hidden items-center gap-8 md:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label}>
              <a
                href={l.href}
                className={`text-label-md font-medium transition-colors hover:text-amud-primary ${
                  l.key === active ? 'text-amud-primary' : 'text-amud-on-surface-variant'
                }`}
              >
                {l.label}
              </a>
            </li>
          ))}
        </ul>
        <div className="flex items-center gap-4">
          <button
            onClick={() => onDeadAction('Sélecteur de langue — maquette.')}
            className="-mx-2 px-2 py-3 text-label-md font-medium text-amud-primary transition-colors hover:text-amud-primary-container"
          >
            DE/AR/FR
          </button>
          <button
            onClick={() => onDeadAction('La connexion réelle se fait via le flux OTP — voir /amud pour le portail des espaces.')}
            className="rounded-lg border border-amud-primary bg-amud-primary px-6 py-2 text-label-md font-medium text-white transition-colors hover:bg-amud-primary-container"
          >
            Login
          </button>
        </div>
      </div>
    </nav>
  );
}

export function MarketingFooter() {
  return (
    <footer className="flex w-full flex-col items-center justify-between gap-base border-t-4 border-amud-primary bg-amud-surface-container-highest px-margin-mobile py-section-gap md:flex-row md:px-gutter">
      <div className="flex flex-col items-center gap-md md:items-start">
        <span className="text-headline-md text-amud-primary">Amud Skills</span>
        <p className="text-center text-sm text-amud-on-surface-variant opacity-80 md:text-left">
          © 2026 Amud Skills. Talent marocain. Standards allemands.
        </p>
      </div>
      <ul className="mt-6 flex flex-wrap justify-center gap-6 md:mt-0">
        {['Imprint', 'Privacy Policy', 'GDPR Compliance', 'Contact', 'Careers'].map((l) => (
          <li key={l}>
            <a href="#" className="text-label-sm text-amud-on-surface-variant transition-colors hover:text-amud-primary">
              {l}
            </a>
          </li>
        ))}
      </ul>
    </footer>
  );
}
