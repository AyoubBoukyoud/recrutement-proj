'use client';

import '@/lib/amud/storage/bootstrap';
import { useEffect, useState } from 'react';
import { loadLocalCenterTeachers } from './localCenterTeachers';

/**
 * Identité factice "je suis cet enseignant" pour l'espace self-service
 * `/amud/teacher/*` — même principe que `useCurrentCenter()` pour l'espace
 * Centre. Persisté en localStorage (clé scalaire) pour survivre aux navigations
 * et au reload. Un `CustomEvent` notifie les composants montés quand le
 * sélecteur change.
 */
const STORAGE_KEY = 'amud_current_teacher_id';
const CHANGE_EVENT = 'amud:current-teacher-change';

export function getCurrentTeacherId(): string {
  if (typeof window === 'undefined') return '';
  const stored = window.localStorage.getItem(STORAGE_KEY);
  if (stored) return stored;
  return loadLocalCenterTeachers()[0]?.id ?? '';
}

export function setCurrentTeacherId(id: string) {
  if (typeof window === 'undefined') return;
  window.localStorage.setItem(STORAGE_KEY, id);
  window.dispatchEvent(new CustomEvent(CHANGE_EVENT));
}

/** Hook réactif : état vide au premier rendu (SSR-safe), hydraté après montage. */
export function useCurrentTeacher() {
  const [teacherId, setTeacherIdState] = useState('');

  useEffect(() => {
    setTeacherIdState(getCurrentTeacherId());
    function onChange() {
      setTeacherIdState(getCurrentTeacherId());
    }
    window.addEventListener(CHANGE_EVENT, onChange);
    return () => window.removeEventListener(CHANGE_EVENT, onChange);
  }, []);

  return {
    teacherId,
    setTeacherId: setCurrentTeacherId,
  } as const;
}
