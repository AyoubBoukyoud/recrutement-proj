'use client';

import { useEffect, useState } from 'react';
import type { Collection, Entity } from './collection';
import './bootstrap';

/**
 * Hook de lecture réactive d'une collection. L'état initial est le `seed`
 * compile-time (identique SSR/premier rendu client, évite le hydration
 * mismatch documenté dans la mémoire projet) ; un effet post-montage relit
 * ensuite la collection réelle (déjà initialisée par `./bootstrap`) et se
 * resynchronise automatiquement à chaque mutation, dans cet onglet ou un autre.
 */
export function useCollection<T extends Entity>(collection: Collection<T>, seed: T[]) {
  const [items, setItems] = useState<T[]>(seed);

  useEffect(() => {
    setItems(collection.getAll());
    return collection.subscribe(() => setItems(collection.getAll()));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [collection]);

  return [
    items,
    {
      add: (item: T) => collection.add(item),
      update: (id: string, patch: Partial<T>) => collection.update(id, patch),
      remove: (id: string) => collection.remove(id),
      replace: (all: T[]) => collection.replace(all),
    },
  ] as const;
}
