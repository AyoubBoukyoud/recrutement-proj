'use client';

import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Aperçu visuel de la recherche recruteur, posé à côté du texte dans la
 * section « Espace recruteur ».
 */
export function RecruiterPreview() {
  const content = useHomeContent();
  const { popular } = useTrades();
  const { filters, previewLabel } = content.recruiter;
  const rows = popular.slice(0, 4);

  return (
    <div className="rounded-3xl border border-white/20 bg-black/40 p-5 sm:p-6 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center justify-between border-b border-white/15 pb-3">
        <p className="text-xs font-black uppercase tracking-wider text-emerald-400">{previewLabel}</p>
        <Icon name="search" className="text-emerald-400 text-lg" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((label) => (
          <span
            key={label}
            className="rounded-full border border-white/20 bg-white/10 px-3 py-1 text-xs font-bold text-white/90 shadow-xs"
          >
            {label}
          </span>
        ))}
      </div>

      <ul className="mt-5 space-y-2.5">
        {rows.map((trade) => (
          <li
            key={trade.slug}
            className="flex items-center gap-3.5 rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-white backdrop-blur-sm transition-colors hover:bg-white/15"
          >
            <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-emerald-500/20 text-emerald-300">
              <Icon name={trade.icon} className="text-xl" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold text-white">{trade.label}</p>
              <p className="truncate text-xs text-emerald-100/70">{trade.sector}</p>
            </div>
            <span className="shrink-0 rounded-xl border border-emerald-400/40 bg-emerald-400/20 px-2.5 py-1 text-[11px] font-black text-emerald-300">
              {trade.germanLevel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
