'use client';

import { emitAmudChange, subscribeAmudChange } from './events';

export type Entity = { id: string };

export interface Collection<T extends Entity> {
  key: string;
  getAll(): T[];
  getById(id: string): T | undefined;
  add(item: T): T;
  update(id: string, patch: Partial<T>): T | undefined;
  remove(id: string): void;
  /** Remplacement complet (bulk, réordonnancement, reset démo). */
  replace(all: T[]): void;
  subscribe(cb: () => void): () => void;
}

/**
 * Fabrique générique de collection localStorage. Remplace les 3 patterns de
 * persistance incohérents historiquement utilisés dans `lib/amud/local*.ts`
 * (delta seul, snapshot complet, patch-map par id) par un seul comportement :
 * la clé contient toujours la liste entière, et chaque mutation émet un
 * événement pour que `useCollection` (et tout autre abonné) se resynchronise
 * sans refresh manuel. C'est aussi le point d'extension pour remplacer
 * localStorage par une vraie API plus tard (`createApiCollection` aurait la
 * même interface `Collection<T>`).
 */
export function createCollection<T extends Entity>(key: string): Collection<T> {
  function readRaw(): T[] {
    if (typeof window === 'undefined') return [];
    try {
      const raw = window.localStorage.getItem(key);
      return raw ? (JSON.parse(raw) as T[]) : [];
    } catch {
      return [];
    }
  }

  function writeRaw(all: T[]) {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(key, JSON.stringify(all));
    emitAmudChange(key);
  }

  return {
    key,
    getAll: readRaw,
    getById(id) {
      return readRaw().find((item) => item.id === id);
    },
    add(item) {
      writeRaw([...readRaw(), item]);
      return item;
    },
    update(id, patch) {
      let updated: T | undefined;
      const next = readRaw().map((item) => {
        if (item.id !== id) return item;
        updated = { ...item, ...patch };
        return updated;
      });
      if (updated) writeRaw(next);
      return updated;
    },
    remove(id) {
      writeRaw(readRaw().filter((item) => item.id !== id));
    },
    replace(all) {
      writeRaw(all);
    },
    subscribe(cb) {
      return subscribeAmudChange(key, cb);
    },
  };
}
