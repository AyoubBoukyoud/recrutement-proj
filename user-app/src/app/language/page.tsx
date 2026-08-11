'use client';

// Interface 2 — Choix de la langue : sélection FR / AR / EN / DE, sauvegarde, puis étape suivante.

import { Suspense } from 'react';
import { useRouter } from 'next/navigation';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES } from '@/lib/i18n';

const LANGUAGE_META: Record<string, { native: string; english: string }> = {
  fr: { native: 'Français', english: 'French' },
  ar: { native: 'العربية', english: 'Arabic' },
  en: { native: 'English', english: 'English' },
  de: { native: 'Deutsch', english: 'German' },
};

function LanguageSelectContent() {
  const router = useRouter();
  const { language, setLanguage, t } = useLanguage();

  // Un seul écran de connexion désormais : /auth-phone porte lui-même le
  // choix « candidat / recruteur », le rôle réel décidant de la destination.
  const handleContinue = () => {
    router.push('/auth-phone');
  };

  return (
    <main className="mx-auto flex min-h-screen max-w-md flex-col bg-surface shadow-subtle">
      <nav className="flex items-center gap-3 px-6 py-4 border-b border-surface-container-high">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary text-onPrimary shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: 20 }}>
            language
          </span>
        </div>
        <span className="text-lg font-extrabold tracking-tight text-primary">Amud Skills</span>
      </nav>

      <div className="flex-1 px-6 pt-6 pb-4">
        <div className="fade-in-entry opacity-0">
          <h2 className="mb-2 text-[11px] font-bold uppercase tracking-widest text-onSurface-variant">
            {t('language_interface_label')}
          </h2>
          <h1 className="text-3xl font-extrabold leading-tight text-onSurface">{t('choose_language_title')}</h1>
          <p className="mt-4 text-sm leading-relaxed text-onSurface-variant">{t('choose_language_hint')}</p>
        </div>

        <div className="fade-in-entry stagger-1 opacity-0 mt-8 space-y-3">
          {LANGUAGES.map((lang) => {
            const isActive = language === lang.code;
            const meta = LANGUAGE_META[lang.code] || { native: lang.label, english: lang.label };
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => setLanguage(lang.code)}
                className={`flex w-full items-center gap-4 rounded-pillar p-4 text-left transition-all duration-200 active:scale-[0.99] ${
                  isActive
                    ? 'border-2 border-primary bg-surface-container-low shadow-sm'
                    : 'border border-outline-variant bg-surface-container-lowest hover:border-primary/50 hover:bg-surface-container-low/50'
                }`}
              >
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-pillar text-2xl shadow-inner ${
                    isActive ? 'bg-primary text-onPrimary' : 'bg-surface-container'
                  }`}
                >
                  {lang.flag}
                </div>
                <div className="flex-grow">
                  <p className={`font-bold text-base ${isActive ? 'text-primary' : 'text-onSurface'}`}>{meta.native}</p>
                  <p className="text-xs text-onSurface-variant">{meta.english}</p>
                </div>
                {isActive ? (
                  <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-primary text-onPrimary shadow-sm">
                    <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                      check
                    </span>
                  </div>
                ) : (
                  <div className="h-5 w-5 shrink-0 rounded-full border-2 border-outline-variant" />
                )}
              </button>
            );
          })}
        </div>
      </div>

      <footer className="fade-in-entry stagger-2 opacity-0 border-t border-outline-variant bg-surface-container-lowest p-6">
        <button
          type="button"
          onClick={handleContinue}
          className="flex w-full items-center justify-center gap-2 rounded-pillar bg-primary py-4 text-sm font-bold text-onPrimary shadow-sm transition-all hover:bg-primary/90 active:scale-[0.98]"
        >
          {t('continue')}
          <span className="material-symbols-outlined" style={{ fontSize: 18 }}>
            arrow_forward
          </span>
        </button>
      </footer>
    </main>
  );
}

export default function LanguageSelectPage() {
  return (
    <Suspense fallback={null}>
      <LanguageSelectContent />
    </Suspense>
  );
}
