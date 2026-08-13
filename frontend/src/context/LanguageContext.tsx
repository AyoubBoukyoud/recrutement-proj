'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import { translate, type TranslationKey } from '@/lib/i18n';
import type { Language } from '@/lib/types';

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: TranslationKey) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    setLanguageState(readStorage<Language>(STORAGE_KEYS.language, 'fr'));
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    writeStorage(STORAGE_KEYS.language, lang);
  }, []);

  const t = useCallback((key: TranslationKey) => translate(language, key), [language]);

  const value = useMemo(
    () => ({ language, setLanguage, t, dir: (language === 'ar' ? 'rtl' : 'ltr') as 'ltr' | 'rtl' }),
    [language, setLanguage, t]
  );

  return <LanguageContext.Provider value={value}>{children}</LanguageContext.Provider>;
}

export function useLanguage(): LanguageContextValue {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage doit être utilisé à l\'intérieur de <LanguageProvider>');
  return ctx;
}
