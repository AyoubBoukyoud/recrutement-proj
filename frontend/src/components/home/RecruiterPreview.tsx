'use client';

import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';

function Icon({ name, className = '' }: { name: string; className?: string }) {
  return <span className={`material-symbols-outlined ${className}`}>{name}</span>;
}

/**
 * Aperçu visuel de la recherche recruteur, posé à côté du texte dans la
 * section « Espace recruteur ». Volontairement construit sur les vrais
 * métiers de `useTrades()` plutôt que sur des candidats ou des pourcentages
 * de match inventés — la page interdit explicitement les chiffres et profils
 * non vérifiés (voir `_note` de home.fr.json).
 */
export function RecruiterPreview() {
  const content = useHomeContent();
  const { popular } = useTrades();
  const { filters, previewLabel } = content.recruiter;
  const rows = popular.slice(0, 4);

  return (
    <div className="rounded-3xl border border-surface-lowest/15 bg-surface-lowest/5 p-5 sm:p-6">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-wider text-primary-light">{previewLabel}</p>
        <Icon name="search" className="text-primary-light" />
      </div>

      <div className="mt-4 flex flex-wrap gap-2">
        {filters.map((label) => (
          <span
            key={label}
            className="rounded-full border border-surface-lowest/20 px-3 py-1.5 text-xs font-bold text-surface-container-high"
          >
            {label}
          </span>
        ))}
      </div>

      <ul className="mt-5 space-y-2">
        {rows.map((trade) => (
          <li
            key={trade.slug}
            className="flex items-center gap-3 rounded-xl bg-surface-lowest/10 px-4 py-3 text-surface-lowest"
          >
            <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-surface-lowest/10">
              <Icon name={trade.icon} className="text-base" />
            </span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-bold">{trade.label}</p>
              <p className="truncate text-xs text-surface-container-high">{trade.sector}</p>
            </div>
            <span className="shrink-0 rounded-full border border-surface-lowest/20 px-2.5 py-1 text-[11px] font-black text-primary-light">
              {trade.germanLevel}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
