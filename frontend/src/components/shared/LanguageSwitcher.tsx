'use client';

import { useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { LANGUAGES } from '@/lib/i18n';
import { Button, IconButton } from '@/components/shared/Button';

/**
 * `compact` : icône seule (globe), pour les headers étroits (candidat mobile,
 * TopBar ops) où la version pilule flag+libellé déborderait. Même menu
 * déroulant dans les deux cas.
 */
export function LanguageSwitcher({ compact = false }: { compact?: boolean }) {
  const { language, setLanguage } = useLanguage();
  const [isOpen, setIsOpen] = useState(false);
  const current = LANGUAGES.find((l) => l.code === language) ?? LANGUAGES[0];

  return (
    <div className="relative">
      {compact ? (
        <IconButton
          variant="ghost"
          aria-label="Changer de langue"
          aria-expanded={isOpen}
          aria-haspopup="menu"
          onClick={() => setIsOpen((v) => !v)}
        >
          <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
            language
          </span>
        </IconButton>
      ) : (
        <Button
          variant="outline"
          size="sm"
          pill
          onClick={() => setIsOpen((v) => !v)}
          aria-expanded={isOpen}
          className="gap-1.5 border-outline-variant bg-surface-lowest px-3 text-onSurface shadow-sm"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 14 }}>
            language
          </span>
          <span>{current.flag} {current.label}</span>
          <span
            className={`material-symbols-outlined transition-transform ${isOpen ? 'rotate-180' : ''}`}
            style={{ fontSize: 14 }}
          >
            expand_more
          </span>
        </Button>
      )}

      {isOpen && (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute end-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest shadow-floating">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium hover:bg-surface-container ${
                  lang.code === language ? 'bg-primary-light font-bold text-onPrimary-container' : 'text-onSurface'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
}
