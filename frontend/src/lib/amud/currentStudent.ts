'use client';

import '@/lib/amud/storage/bootstrap';
import { useEffect, useState } from 'react';
import { loadLocalCenterStudents } from './localCenterStudents';

/**
 * Identité factice "je suis cet étudiant" pour l'espace self-service
 * `/amud/student/*` — même principe que `useCurrentCenter()` pour l'espace
 * Centre. Persisté en localStorage (clé scalaire) pour survivre aux navigations
 * et au reload. Un `CustomEvent` notifie les composants montés quand le
 * sélecteur change.
 */
const STORAGE_KEY = 'amud_current_student_id';
const CHANGE_EVENT = 'amud:current-student-change';

export function getCurrentStudentId(): string {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return loadLocalCenterStudents()[0]?.id ?? '';
}

export function setCurrentStudentId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Hook réactif : état vide au premier rendu (SSR-safe), hydraté après montage. */
export function useCurrentStudent() {
  const [studentId, setStudentIdState] = useState('');

  useEffect(() => {
    setStudentIdState(getCurrentStudentId());
    function onChange() {
      setStudentIdState(getCurrentStudentId());
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return {
    studentId,
    setStudentId: setCurrentStudentId,
  } as const;
}
