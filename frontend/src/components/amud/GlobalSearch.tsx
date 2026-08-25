'use client';

import { useEffect, useRef, type RefObject } from 'react';

export type GlobalSearchResult = { id: string; label: string; sub: string; href: string; icon: string };

/**
 * Ctrl+K (⌘K sur mac) pour ouvrir/focaliser la recherche globale, quel que
 * soit le rôle. `focus` doit ouvrir le panneau ET rendre le focus clavier au
 * champ (voir usage dans les Shells : `() => { setOpen(true); inputRef.current?.focus(); }`).
 */
export function useGlobalSearchShortcut(focus: () => void) {
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        focus();
      }
    }
    window.addEventListener('keydown', onKeyDown);
    return () => window.removeEventListener('keydown', onKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}

/**
 * Champ de recherche + résultats du Header — remplace le bloc identique
 * (input, dropdown de résultats, fermeture au clic extérieur) réimplémenté
 * par `AdminShell`/`CommercialShell`/`CompanyShell`/`EmployerShell`. Chaque
 * rôle garde son propre hook de résultats (`useXSearchResults`, déjà borné
 * aux données de son espace) et ne passe ici que `results` — la logique de
 * recherche métier n'est pas généralisée, seule la coquille visuelle l'est.
 */
export function GlobalSearch({
  query,
  onQueryChange,
  results,
  onSelect,
  placeholder = 'Rechercher…',
  inputRef,
  open,
  onOpenChange,
  className = 'relative hidden w-72 md:block',
}: {
  query: string;
  onQueryChange: (next: string) => void;
  results: GlobalSearchResult[];
  onSelect: (href: string) => void;
  placeholder?: string;
  inputRef?: RefObject<HTMLInputElement>;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  className?: string;
}) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    function onClick(e: MouseEvent) {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) onOpenChange(false);
    }
    function onKey(e: KeyboardEvent) {
      if (e.key === 'Escape') onOpenChange(false);
    }
    document.addEventListener('mousedown', onClick);
    window.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onClick);
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onOpenChange]);

  return (
    <div ref={containerRef} className={className}>
      <span className="material-symbols-outlined pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-amud-on-surface-variant">
        search
      </span>
      <input
        ref={inputRef}
        value={query}
        onChange={(e) => {
          onQueryChange(e.target.value);
          onOpenChange(true);
        }}
        onFocus={() => onOpenChange(true)}
        className="w-full rounded-lg border border-amud-outline-variant bg-amud-surface-container-low py-2 pl-10 pr-14 text-body-md text-amud-on-surface outline-none transition-all focus:border-transparent focus:ring-2 focus:ring-amud-primary"
        placeholder={placeholder}
        aria-label={placeholder}
        type="text"
      />
      <kbd
        aria-hidden="true"
        className="pointer-events-none absolute right-2.5 top-1/2 hidden -translate-y-1/2 rounded border border-amud-outline-variant bg-amud-surface px-1.5 py-0.5 text-[10px] font-medium text-amud-on-surface-variant lg:inline-block"
      >
        Ctrl K
      </kbd>
      {open && query.trim().length >= 2 ? (
        <div className="absolute left-0 right-0 top-full z-40 mt-2 max-h-80 overflow-y-auto rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
          {results.length === 0 ? (
            <p className="p-md text-label-sm text-amud-on-surface-variant">Aucun résultat pour « {query} ».</p>
          ) : (
            results.map((r) => (
              <button
                key={r.id}
                type="button"
                onClick={() => onSelect(r.href)}
                className="flex w-full items-center gap-sm px-md py-sm text-left transition-colors hover:bg-amud-surface-container-low"
              >
                <span className="material-symbols-outlined text-amud-primary">{r.icon}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-label-md text-amud-on-surface">{r.label}</span>
                  <span className="block truncate text-label-sm text-amud-on-surface-variant">{r.sub}</span>
                </span>
              </button>
            ))
          )}
        </div>
      ) : null}
    </div>
  );
}
