'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useHomeContent } from '@/lib/useLocalizedContent';

/** Public footer containing only implemented destinations. */
export function SiteFooter() {
  const { footer } = useHomeContent();
  return (
    <footer className="border-t border-home-line bg-home-surface transition-colors duration-300">
      <div className="mx-auto w-full max-w-[1280px] px-6 py-14 lg:px-12">
        <div className="grid gap-10 lg:grid-cols-12">
          <div className="lg:col-span-3">
            <div className="flex items-center font-extrabold text-home-ink">
              <span className="flex h-20 w-20 items-center justify-center rounded-xl bg-[#f7faf8] p-1 shadow-sm ring-1 ring-black/5 dark:bg-transparent dark:shadow-none dark:ring-0">
                <Image
                  src="/assets/images/logo.png"
                  alt="Amud Skills"
                  width={160}
                  height={160}
                  unoptimized
                  className="home-brand-logo h-[72px] w-[72px] scale-[1.35] object-contain transition-[filter] duration-200"
                />
              </span>
            </div>
            <p className="mt-4 max-w-[42ch] text-sm leading-relaxed text-home-slate">{footer.tagline}</p>
          </div>

          {footer.columns.map((column) => (
            <nav key={column.title} className="lg:col-span-3" aria-label={column.title}>
              <h2 className="text-xs font-bold uppercase tracking-wider text-home-slate">{column.title}</h2>
              <ul className="mt-4 space-y-2.5">
                {column.links.map((link) => (
                  <li key={link.label}>
                    <Link
                      href={link.href}
                      className="text-sm font-medium text-home-ink/80 transition-colors hover:text-home-coral"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-12 flex flex-col gap-3 border-t border-home-line pt-6 text-xs text-home-slate sm:flex-row sm:items-center sm:justify-between">
          <p>
            © {new Date().getFullYear()} Amud Skills. {footer.rights}
          </p>
          <p>{footer.legalNote}</p>
        </div>
      </div>
    </footer>
  );
}
