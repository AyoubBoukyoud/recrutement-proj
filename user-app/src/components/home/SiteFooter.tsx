'use client';

import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';

/**
 * Sur ce type de plateforme, un pied de page légal complet **est** un signal de
 * confiance : un footer vide se lit comme une page éphémère, ce qui est
 * exactement ce qu'un candidat méfiant cherche à repérer.
 */
export function SiteFooter() {
  const { footer } = useHomeContent();
  return (
    <footer className="border-t border-outline-variant/50 bg-surface-container/60">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2 font-extrabold text-primary-dark">
              <span className="flex h-9 w-9 items-center justify-center rounded-xl bg-primary text-on-primary">
                <span className="material-symbols-outlined" style={{ fontSize: 20 }} aria-hidden="true">
                  travel_explore
                </span>
              </span>
              Amud Skills
            </div>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-onSurface-variant">{footer.tagline}</p>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} className="lg:col-span-3" aria-label={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-onSurface-variant transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-outline-variant/50 pt-6 text-xs text-outline sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Amud Skills. {footer.rights}
          </p>
          <p>{footer.legalNote}</p>
        </div>
      </div>
    </footer>
  );
}
