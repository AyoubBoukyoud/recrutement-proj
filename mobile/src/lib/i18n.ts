import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import type { Language } from './types';

import commonFr from '@/locales/fr/common.json';
import authFr from '@/locales/fr/auth.json';
import candidateAFr from '@/locales/fr/candidateA.json';
import candidateBFr from '@/locales/fr/candidateB.json';
import candidateCFr from '@/locales/fr/candidateC.json';
import candidateDFr from '@/locales/fr/candidateD.json';
import employerFr from '@/locales/fr/employer.json';
import adminFr from '@/locales/fr/admin.json';

export const LANGUAGES: { code: Language; label: string; flag: string }[] = [
  { code: 'fr', label: 'Français', flag: '🇫🇷' },
  { code: 'ar', label: 'العربية', flag: '🇲🇦' },
  { code: 'en', label: 'English', flag: '🇬🇧' },
  { code: 'de', label: 'Deutsch', flag: '🇩🇪' },
];

// Chaque écran (ou groupe d'écrans) possède son propre namespace de traduction,
// stocké sous forme de fichier JSON par langue dans src/locales/<langue>/<namespace>.json.
// Usage : t('namespace:cle.imbriquee').
export const defaultNS = 'common';

const namespaces = [
  'common',
  'auth',
  'candidateA',
  'candidateB',
  'candidateC',
  'candidateD',
  'employer',
  'admin',
] as const;

// Seul le français (langue par défaut) est chargé au démarrage : les 3 autres langues
// représentent ~75% du poids des traductions et ne sont chargées à la demande que si
// l'utilisateur les sélectionne (voir ensureLanguageLoaded), pour alléger le bundle initial.
if (!i18n.isInitialized) {
  i18n.use(initReactI18next).init({
    resources: {
      fr: {
        common: commonFr,
        auth: authFr,
        candidateA: candidateAFr,
        candidateB: candidateBFr,
        candidateC: candidateCFr,
        candidateD: candidateDFr,
        employer: employerFr,
        admin: adminFr,
      },
    },
    lng: 'fr',
    fallbackLng: 'fr',
    defaultNS,
    ns: namespaces,
    interpolation: { escapeValue: false },
    react: { useSuspense: false },
  });
}

const loadedLanguages = new Set<Language>(['fr']);
const pendingLanguages = new Map<Language, Promise<void>>();

export function ensureLanguageLoaded(lang: Language): Promise<void> {
  if (loadedLanguages.has(lang)) return Promise.resolve();

  const pending = pendingLanguages.get(lang);
  if (pending) return pending;

  const promise = Promise.all(
    namespaces.map((ns) =>
      import(`@/locales/${lang}/${ns}.json`).then((mod) => {
        i18n.addResourceBundle(lang, ns, mod.default);
      })
    )
  ).then(() => {
    loadedLanguages.add(lang);
    pendingLanguages.delete(lang);
  });

  pendingLanguages.set(lang, promise);
  return promise;
}

export default i18n;
