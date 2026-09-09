'use client';

import '@/lib/amud/storage/bootstrap';
import { useEffect, useState } from 'react';
import type { CenterRole } from '@/data/amud/centerTypes';
import { loadLocalCentres } from './localCentres';

/**
 * Identité factice "je suis dans ce centre, avec ce rôle" pour l'espace
 * self-service `/amud/centre/*` (aucune authentification réelle dans le
 * module `/amud` — même principe que `CURRENT_COMMERCIAL`). Persisté en
 * localStorage (clé scalaire, pas une `Collection`) pour survivre à la
 * navigation et au reload ; un `CustomEvent` notifie les composants montés
 * (Shell, pages) quand le sélecteur change, à la manière de
 * `emitAmudChange` mais hors du système de collections typées.
 */
const STORAGE_KEY = 'amud_current_center_id';
const ROLE_STORAGE_KEY = 'amud_current_center_role';
const CHANGE_EVENT = 'amud:current-center-change';
const DEFAULT_ROLE: CenterRole = 'CENTER_OWNER';

export function getCurrentCenterId(): string {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return loadLocalCentres()[0]?.id ?? '';
}

export function setCurrentCenterId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

export function getCurrentCenterRole(): CenterRole {
  if (typeof window === 'undefined') return DEFAULT_ROLE;
  return (window.localStorage.getItem(ROLE_STORAGE_KEY) as CenterRole | null) ?? DEFAULT_ROLE;
}

export function setCurrentCenterRole(role: CenterRole) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(ROLE_STORAGE_KEY, role);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Hook réactif : état vide au premier rendu (SSR-safe, évite le hydration mismatch documenté dans la mémoire projet), hydraté après montage. */
export function useCurrentCenter() {
  const [centerId, setCenterIdState] = useState('');
  const [role, setRoleState] = useState<CenterRole>(DEFAULT_ROLE);

  useEffect(() => {
    setCenterIdState(getCurrentCenterId());
    setRoleState(getCurrentCenterRole());
    function onChange() {
      setCenterIdState(getCurrentCenterId());
      setRoleState(getCurrentCenterRole());
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return {
    centerId,
    role,
    setCenterId: setCurrentCenterId,
    setRole: setCurrentCenterRole,
  } as const;
}
