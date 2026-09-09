'use client';

import { useMemo, useState } from 'react';

/**
 * Recherche + filtres d'une liste CRUD du module Centres.
 *
 * Les 8 pages `/amud/centre/*` avaient besoin exactement du même triptyque
 * (champ de recherche plein texte, quelques `<select>` de filtre, compteur
 * de filtres actifs pour la pastille du bottom-sheet mobile, remise à zéro).
 * Le concentrer ici évite que chaque page réinvente sa façon de filtrer —
 * et garantit que « rechercher » veut dire la même chose partout.
 */
export function useCrudSearch<T, F extends Record<string, string>>(
  items: T[],
  initialFilters: F,
  options: {
    /** Champs concaténés puis comparés en minuscules à la recherche. */
    text: (item: T) => (string | number | undefined | null)[];
    /** Filtres additionnels ; une valeur vide signifie « pas de filtre ». */
    match?: (item: T, filters: F) => boolean;
  },
) {
  const [search, setSearch] = useState('');
  const [filters, setFilters] = useState<F>(initialFilters);

  const setFilter = (key: keyof F, value: string) => setFilters((prev) => ({ ...prev, [key]: value }));
  const reset = () => {
    setSearch('');
    setFilters(initialFilters);
  };

  const activeFilterCount = Object.values(filters).filter((v) => v !== '').length;

  const results = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter((item) => {
      if (q) {
        const haystack = options
          .text(item)
          .filter((v) => v !== undefined && v !== null)
          .join(' ')
          .toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return options.match ? options.match(item, filters) : true;
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [items, search, filters]);

  return { search, setSearch, filters, setFilter, reset, activeFilterCount, results };
}

/** Options `<select>` à partir d'une liste de valeurs simples. */
export function toOptions(values: readonly string[]) {
  return values.map((v) => ({ value: v, label: v }));
}
