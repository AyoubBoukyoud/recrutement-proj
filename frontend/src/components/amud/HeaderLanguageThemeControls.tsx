'use client';

import { useDropdown } from '@/components/amud/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/i18n';
import type { ThemeMode } from '@/lib/types';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Clair', icon: 'light_mode' },
  { mode: 'dark', label: 'Sombre', icon: 'dark_mode' },
  { mode: 'system', label: 'Système', icon: 'brightness_auto' },
];

const DEFAULT_ICON_BUTTON_CLASS =
  'rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary';

/**
 * Sélecteur de langue + bascule clair/sombre/système, au même idiome que les
 * autres boutons icône du header (cloche, réglages, aide) des 5 coquilles
 * `/amud/*`. `iconButtonClassName` permet de matcher le hover local exact
 * (ex. EmployerShell/CompanyShell utilisent `hover:bg-amud-surface-container-high`).
 */
export function HeaderLanguageThemeControls({
  iconButtonClassName = DEFAULT_ICON_BUTTON_CLASS,
}: {
  iconButtonClassName?: string;
}) {
  const langMenu = useDropdown<HTMLDivElement>();
  const themeMenu = useDropdown<HTMLDivElement>();
  const { language, setLanguage } = useLanguage();
  const { mode, setMode } = useTheme();
  const currentTheme = THEME_OPTIONS.find((t) => t.mode === mode) ?? THEME_OPTIONS[2];

  return (
    <>
      <div ref={langMenu.ref} className="relative">
        <button
          type="button"
          onClick={() => langMenu.setOpen((v) => !v)}
          className={iconButtonClassName}
          aria-label="Changer de langue"
          aria-haspopup="menu"
          aria-expanded={langMenu.open}
        >
          <span className="material-symbols-outlined">language</span>
        </button>
        {langMenu.open ? (
          <div className="absolute right-0 top-full z-40 mt-2 w-44 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
            {LANGUAGES.map((lang) => (
              <button
                key={lang.code}
                type="button"
                onClick={() => {
                  setLanguage(lang.code);
                  langMenu.setOpen(false);
                }}
                className={`flex w-full items-center gap-sm px-md py-sm text-left text-label-md transition-colors hover:bg-amud-surface-container-low ${
                  lang.code === language ? 'font-semibold text-amud-primary' : 'text-amud-on-surface'
                }`}
              >
                <span>{lang.flag}</span>
                <span>{lang.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>

      <div ref={themeMenu.ref} className="relative">
        <button
          type="button"
          onClick={() => themeMenu.setOpen((v) => !v)}
          className={iconButtonClassName}
          aria-label="Changer de thème"
          aria-haspopup="menu"
          aria-expanded={themeMenu.open}
        >
          <span className="material-symbols-outlined">{currentTheme.icon}</span>
        </button>
        {themeMenu.open ? (
          <div className="absolute right-0 top-full z-40 mt-2 w-40 overflow-hidden rounded-lg border border-amud-outline-variant bg-amud-surface shadow-xl animate-amud-fade-in">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setMode(opt.mode);
                  themeMenu.setOpen(false);
                }}
                className={`flex w-full items-center gap-sm px-md py-sm text-left text-label-md transition-colors hover:bg-amud-surface-container-low ${
                  opt.mode === mode ? 'font-semibold text-amud-primary' : 'text-amud-on-surface'
                }`}
              >
                <span className="material-symbols-outlined text-[18px]">{opt.icon}</span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </>
  );
}
