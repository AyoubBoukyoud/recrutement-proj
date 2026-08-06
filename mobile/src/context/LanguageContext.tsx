'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';
import i18n, { ensureLanguageLoaded } from '@/lib/i18n';
import type { Language } from '@/lib/types';

type TranslateOptions = Record<string, string | number | boolean>;

interface LanguageContextValue {
  language: Language;
  setLanguage: (language: Language) => void;
  t: (key: string, options?: TranslateOptions) => string;
  dir: 'ltr' | 'rtl';
}

const LanguageContext = createContext<LanguageContextValue | undefined>(undefined);

export function LanguageProvider({ children }: { children: React.ReactNode }) {
  const [language, setLanguageState] = useState<Language>('fr');

  useEffect(() => {
    const stored = readStorage<Language>(STORAGE_KEYS.language, 'fr');
    if (stored === 'fr') {
      i18n.changeLanguage('fr');
      return;
    }
    let cancelled = false;
    ensureLanguageLoaded(stored).then(() => {
      if (cancelled) return;
      i18n.changeLanguage(stored);
      setLanguageState(stored);
    });
    return () => {
      cancelled = true;
    };
  }, []);

  const setLanguage = useCallback((lang: Language) => {
    writeStorage(STORAGE_KEYS.language, lang);
    ensureLanguageLoaded(lang).then(() => {
      i18n.changeLanguage(lang);
      setLanguageState(lang);
    });
  }, []);

  const t = useCallback(
    (key: string, options?: TranslateOptions) => i18n.t(key, options),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [language]
  );

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
