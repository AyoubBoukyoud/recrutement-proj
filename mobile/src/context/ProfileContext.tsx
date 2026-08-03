'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import type { CandidateProfile, ProfileStep } from '@/lib/types';

const ALL_STEPS: ProfileStep[] = [1, 2, 3, 4, 5];

export const EMPTY_PROFILE: CandidateProfile = {
  firstName: '',
  lastName: '',
  birthDate: '',
  city: '',
  sector: '',
  jobTitle: '',
  yearsExperience: 0,
  languages: [],
  desiredStartDate: '',
  noticePeriodWeeks: 0,
  documents: [],
  videoUrl: null,
  testLangueScore: null,
  identityVerified: false,
  completedSteps: [],
  isComplete: false,
  avatarInitials: '',
};

interface ProfileContextValue {
  profile: CandidateProfile;
  isHydrated: boolean;
  updateProfile: (partial: Partial<CandidateProfile>) => void;
  markStepComplete: (step: ProfileStep) => void;
  getIncompleteStep: () => ProfileStep | null;
  resetProfile: () => void;
}

const ProfileContext = createContext<ProfileContextValue | undefined>(undefined);

export function ProfileProvider({ children }: { children: React.ReactNode }) {
  const [profile, setProfile] = useState<CandidateProfile>(EMPTY_PROFILE);
  const [isHydrated, setIsHydrated] = useState(false);

  useEffect(() => {
    setProfile(readStorage<CandidateProfile>(STORAGE_KEYS.profile, EMPTY_PROFILE));
    setIsHydrated(true);
  }, []);

  const persist = useCallback((next: CandidateProfile) => {
    setProfile(next);
    writeStorage(STORAGE_KEYS.profile, next);
  }, []);

  const updateProfile = useCallback(
    (partial: Partial<CandidateProfile>) => {
      setProfile((prev) => {
        const next = { ...prev, ...partial };
        writeStorage(STORAGE_KEYS.profile, next);
        return next;
      });
    },
    []
  );

  const markStepComplete = useCallback((step: ProfileStep) => {
    setProfile((prev) => {
      const completedSteps = prev.completedSteps.includes(step)
        ? prev.completedSteps
        : [...prev.completedSteps, step].sort();
      const isComplete = ALL_STEPS.every((s) => completedSteps.includes(s));
      const next = { ...prev, completedSteps, isComplete };
      writeStorage(STORAGE_KEYS.profile, next);
      return next;
    });
  }, []);

  const getIncompleteStep = useCallback((): ProfileStep | null => {
    const missing = ALL_STEPS.find((step) => !profile.completedSteps.includes(step));
    return missing ?? null;
  }, [profile.completedSteps]);

  const resetProfile = useCallback(() => {
    persist(EMPTY_PROFILE);
  }, [persist]);

  const value = useMemo(
    () => ({ profile, isHydrated, updateProfile, markStepComplete, getIncompleteStep, resetProfile }),
    [profile, isHydrated, updateProfile, markStepComplete, getIncompleteStep, resetProfile]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileContextValue {
  const ctx = useContext(ProfileContext);
  if (!ctx) throw new Error('useProfile doit être utilisé à l\'intérieur de <ProfileProvider>');
  return ctx;
}
