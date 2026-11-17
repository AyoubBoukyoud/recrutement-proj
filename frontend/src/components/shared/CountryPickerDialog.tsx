'use client';

// Fenêtre du sélecteur d'indicatif (chargée à la demande par CountryPicker) :
// tous les pays, avec recherche par nom, code ISO ou indicatif. Feuille en bas
// d'écran sur mobile, fenêtre centrée sur bureau.

import { useMemo, useRef, useState, type RefObject } from 'react';
import { Dialog } from '@base-ui/react/dialog';
import { useLanguage } from '@/context/LanguageContext';
import { COUNTRIES, PINNED_COUNTRIES, flagEmoji, type Country } from '@/lib/countries';

type Entry = Country & { name: string; haystack: string };

/** Minuscules sans accents, pour que « allem » trouve « Allemagne ». */
function fold(text: string): string {
  return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function regionNames(locale: string): (iso: string) => string {
  try {
    const names = new Intl.DisplayNames([locale], { type: 'region' });
    return (iso) => names.of(iso) ?? iso;
  } catch {
    return (iso) => iso;
  }
}

export function CountryPickerDialog({
  open,
  onOpenChange,
  value,
  onChoose,
  triggerRef,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Code ISO du pays choisi. */
  value: string;
  onChoose: (iso: string) => void;
  /** Le bouton déclencheur, qui reprend le focus à la fermeture. */
  triggerRef: RefObject<HTMLButtonElement | null>;
}) {
  const { language, dir, t } = useLanguage();
  const [query, setQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const entries = useMemo<Entry[]>(() => {
    const localName = regionNames(language);
    // Les noms français et anglais restent cherchables quelle que soit la langue.
    const alternates = ['fr', 'en'].filter((locale) => locale !== language).map(regionNames);
    return COUNTRIES.map((country) => {
      const name = localName(country.iso);
      return {
        ...country,
        name,
        haystack: fold([name, ...alternates.map((of) => of(country.iso)), country.iso].join(' ')),
      };
    }).sort((a, b) => a.name.localeCompare(b.name, language));
  }, [language]);

  const results = useMemo(() => {
    const text = fold(query.trim());
    if (text === '') {
      const pinned = PINNED_COUNTRIES.map((iso) => entries.find((entry) => entry.iso === iso)!);
      return [...pinned, ...entries.filter((entry) => !PINNED_COUNTRIES.includes(entry.iso))];
    }
    const digits = text.replace(/\D/g, '');
    // « +41 », « 0041 » ou « 41 » : recherche par indicatif.
    if (digits !== '' && /^[+\d\s]+$/.test(text)) {
      const dial = `+${digits.replace(/^00/, '')}`;
      return entries.filter((entry) => entry.dial.startsWith(dial));
    }
    return entries.filter((entry) => entry.haystack.includes(text));
  }, [entries, query]);

  return (
    <Dialog.Root
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next);
        if (next) setQuery('');
      }}
    >
      <Dialog.Portal>
        <Dialog.Backdrop className="fixed inset-0 z-[90] bg-black/40" />
        <Dialog.Popup
          initialFocus={searchRef}
          finalFocus={triggerRef}
          lang={language}
          dir={dir}
          className="fixed inset-x-0 bottom-0 z-[100] flex h-[80dvh] flex-col rounded-t-2xl bg-surface text-onSurface shadow-xl outline-none sm:inset-x-auto sm:bottom-auto sm:left-1/2 sm:top-1/2 sm:h-[min(560px,80dvh)] sm:w-[400px] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-2xl"
        >
          <div className="flex items-center justify-between gap-2 px-4 pt-4">
            <Dialog.Title className="text-base font-extrabold text-primary">{t('phone_country_title')}</Dialog.Title>
            <Dialog.Close
              aria-label={t('phone_country_close')}
              className="flex h-9 w-9 items-center justify-center rounded-full text-onSurface-variant hover:bg-surface-container-low focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
            >
              <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 20 }}>
                close
              </span>
            </Dialog.Close>
          </div>

          <div className="px-4 py-3">
            <div className="flex h-11 items-center gap-2 rounded-pillar border border-outline-variant bg-surface-container-lowest px-3 focus-within:border-primary focus-within:ring-2 focus-within:ring-primary-light">
              <span className="material-symbols-outlined text-onSurface-variant" aria-hidden="true" style={{ fontSize: 18 }}>
                search
              </span>
              <input
                ref={searchRef}
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                onKeyDown={(event) => {
                  // Entrée choisit le premier résultat, sans envoyer le formulaire.
                  if (event.key !== 'Enter') return;
                  event.preventDefault();
                  if (results[0]) onChoose(results[0].iso);
                }}
                placeholder={t('phone_country_search')}
                aria-label={t('phone_country_search')}
                autoComplete="off"
                className="min-w-0 flex-1 border-none bg-transparent p-0 text-sm text-onSurface placeholder:text-outline outline-none focus:ring-0"
              />
            </div>
          </div>

          <ul className="min-h-0 flex-1 overflow-y-auto overscroll-contain px-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
            {results.map((entry) => {
              const isSelected = entry.iso === value;
              return (
                <li key={entry.iso}>
                  <button
                    type="button"
                    onClick={() => onChoose(entry.iso)}
                    aria-current={isSelected ? 'true' : undefined}
                    className={[
                      'flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-start text-sm',
                      'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary',
                      isSelected ? 'bg-primary/10 font-bold text-primary' : 'text-onSurface hover:bg-surface-container-low',
                    ].join(' ')}
                  >
                    <span aria-hidden="true" className="text-lg leading-none">{flagEmoji(entry.iso)}</span>
                    <span className="min-w-0 flex-1 truncate">{entry.name}</span>
                    <span dir="ltr" className="shrink-0 tabular-nums text-onSurface-variant">{entry.dial}</span>
                  </button>
                </li>
              );
            })}
            {results.length === 0 && (
              <li className="px-3 py-8 text-center text-sm text-onSurface-variant">{t('phone_country_none')}</li>
            )}
          </ul>
        </Dialog.Popup>
      </Dialog.Portal>
    </Dialog.Root>
  );
}
