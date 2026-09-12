'use client';

import { useDropdown } from '@/components/amud/ui';
import { useLanguage } from '@/context/LanguageContext';
import { useTheme } from '@/context/ThemeContext';
import { LANGUAGES } from '@/lib/i18n';

const DEFAULT_ICON_BUTTON_CLASS =
  'rounded-full p-2 text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low hover:text-amud-primary';

/**
 * Sélecteur de langue + bascule clair/sombre, au même idiome que les autres
 * boutons icône du header (cloche, réglages, aide) des 5 coquilles
 * `/amud/*`. Le thème bascule en un clic (pas de menu) — même geste que
 * `components/shared/ThemeToggle` côté produit. `iconButtonClassName` permet
 * de matcher le hover local exact (ex. EmployerShell/CompanyShell utilisent
 * `hover:bg-amud-surface-container-high`).
 */
export function HeaderLanguageThemeControls({
  iconButtonClassName = DEFAULT_ICON_BUTTON_CLASS,
}: {
  iconButtonClassName?: string;
}) {
  const langMenu = useDropdown<HTMLDivElement>();
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === 'dark';

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

      <button
        type="button"
        onClick={() => setMode(isDark ? 'light' : 'dark')}
        className={iconButtonClassName}
        aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      >
        <span className="material-symbols-outlined">{isDark ? 'light_mode' : 'dark_mode'}</span>
      </button>
    </>
  );
}

/**
 * Même sélecteurs langue/thème que `HeaderLanguageThemeControls`, mais posés
 * directement dans le corps d'un menu déroulant (profil) plutôt qu'en icônes
 * séparées du header — sélection en un clic, sans sous-menu imbriqué.
 */
export function InlineLanguageThemeControls() {
  const { language, setLanguage } = useLanguage();
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <div className="flex flex-col gap-sm p-md">
      <div>
        <div className="mb-1.5 text-label-sm text-amud-on-surface-variant">Langue</div>
        <div className="flex flex-wrap gap-1.5">
          {LANGUAGES.map((lang) => (
            <button
              key={lang.code}
              type="button"
              onClick={() => setLanguage(lang.code)}
              aria-pressed={lang.code === language}
              className={`flex items-center gap-1 rounded-full border px-2.5 py-1 text-label-sm transition-colors ${
                lang.code === language
                  ? 'border-amud-primary bg-amud-primary/10 font-semibold text-amud-primary'
                  : 'border-amud-outline-variant text-amud-on-surface hover:bg-amud-surface-container-low'
              }`}
            >
              <span>{lang.flag}</span>
              <span>{lang.label}</span>
            </button>
          ))}
        </div>
      </div>
      <div>
        <div className="mb-1.5 text-label-sm text-amud-on-surface-variant">Thème</div>
        <button
          type="button"
          onClick={() => setMode(isDark ? 'light' : 'dark')}
          className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-amud-outline-variant px-2 py-1.5 text-[11px] text-amud-on-surface-variant transition-colors hover:bg-amud-surface-container-low"
        >
          <span className="material-symbols-outlined text-[18px]">{isDark ? 'light_mode' : 'dark_mode'}</span>
          {isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
        </button>
      </div>
    </div>
  );
}
