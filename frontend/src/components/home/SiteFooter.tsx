'use client';

import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';

/** Public footer containing only implemented destinations. */
export function SiteFooter() {
  const { footer } = useHomeContent();
  return (
    <footer className="border-t border-slate-200/80 dark:border-white/10 bg-slate-50/80 dark:bg-[#0e0c0a] transition-colors">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="flex items-center gap-2.5 font-black text-lg text-emerald-950 dark:text-white">
              <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 p-1 shadow-sm ring-1 ring-black/5 dark:ring-white/20">
                <img src="/assets/images/logo-mark.png" alt="Amud Skills" className="h-full w-full object-contain" />
              </div>
              <span>Amud Skills</span>
            </div>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-onSurface-variant dark:text-zinc-400">{footer.tagline}</p>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} className="lg:col-span-3" aria-label={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-outline dark:text-zinc-400">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-onSurface-variant dark:text-zinc-300 transition-colors hover:text-emerald-600 dark:hover:text-emerald-400"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-slate-200/60 dark:border-white/10 pt-6 text-xs text-outline dark:text-zinc-500 sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Amud Skills. {footer.rights}
          </p>
          <p>{footer.legalNote}</p>
        </div>
      </div>
    </footer>
  );
}
