'use client';

import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useHomeContent, useTrades } from '@/lib/useLocalizedContent';
import { searchTrades, type Trade } from '@/lib/trades';
import { Button } from '@/components/shared/Button';

/** Assez long pour ne pas recalculer à chaque frappe, assez court pour rester instantané. */
const DEBOUNCE_MS = 150;

/** Hauteur de la barre de recherche : la liste s'ouvre juste en dessous. */
const LIST_OFFSET = 76;

/** En dessous de cette place disponible, on remonte le champ au lieu d'écraser la liste. */
const COMFORTABLE_HEIGHT = 240;

/** Sous l'en-tête fixe, une fois le champ remonté. */
const HEADER_CLEARANCE = 96;

const MIN_LIST_HEIGHT = 160;
const MARGIN_BELOW = 16;

/** Le terme saisi est surligné dans la suggestion : on voit *pourquoi* elle est proposée. */
function Highlighted({ label, term }: { label: string; term: string }) {
  const index = term ? label.toLowerCase().indexOf(term.toLowerCase()) : -1;
  if (index < 0) return <>{label}</>;

  return (
    <>
      {label.slice(0, index)}
      <mark className="bg-transparent font-bold text-primary">{label.slice(index, index + term.length)}</mark>
      {label.slice(index + term.length)}
    </>
  );
}

export function TradeSearch({ className = '' }: { className?: string }) {
  const content = useHomeContent();
  const { search } = content;
  const { popular, sectors, language } = useTrades();
  const router = useRouter();
  const listboxId = useId();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const [term, setTerm] = useState('');
  const [debounced, setDebounced] = useState('');
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(-1);
  const [advanced, setAdvanced] = useState(false);
  const [sector, setSector] = useState('');
  const [level, setLevel] = useState('');
  const [notFound, setNotFound] = useState<string | null>(null);
  const [isNarrow, setIsNarrow] = useState(false);
  const [maxHeight, setMaxHeight] = useState<number | null>(null);

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(term), DEBOUNCE_MS);
    return () => clearTimeout(timer);
  }, [term]);

  // Sur mobile, le clavier virtuel recouvre les suggestions affichées sous le
  // champ. La recherche passe donc en feuille plein écran, avec le champ en
  // haut et la liste dans l'espace restant.
  useEffect(() => {
    const query = window.matchMedia('(max-width: 639px)');
    const sync = () => setIsNarrow(query.matches);
    sync();
    query.addEventListener('change', sync);
    return () => query.removeEventListener('change', sync);
  }, []);

  const { suggestions, failed } = useMemo<{ suggestions: Trade[]; failed: boolean }>(() => {
    try {
      const base = debounced.trim() === '' ? popular : searchTrades(debounced, language);
      return { suggestions: sector ? base.filter((trade) => trade.sector === sector) : base, failed: false };
    } catch {
      // La recherche est locale et ne devrait pas échouer ; le jour où elle
      // interrogera une API (option B), l'état d'erreur existe déjà.
      return { suggestions: [], failed: true };
    }
  }, [debounced, sector, popular, language]);

  const sheet = open && isNarrow;

  // `max-h-[60vh]` ne disait rien de l'endroit où la liste *commence* : quand le
  // champ est bas dans la fenêtre, 60vh de suggestions passent sous le bord de
  // l'écran, et comme le contenu tient dans cette hauteur la liste n'a pas de
  // barre de défilement — les dernières propositions devenaient inatteignables.
  // On la borne donc à la place réellement disponible sous le champ, ce qui la
  // rend défilable dès qu'elle déborde.
  useEffect(() => {
    if (!open || sheet) {
      setMaxHeight(null);
      return;
    }

    const measure = () => {
      const box = containerRef.current?.getBoundingClientRect();
      if (!box) return;
      // La barre d'action mobile est fixée en bas et recouvrirait les dernières
      // suggestions ; masquée (>= lg), sa hauteur mesurée vaut 0.
      const bar = document.querySelector('[data-mobile-cta]')?.getBoundingClientRect().height ?? 0;
      setMaxHeight(Math.max(MIN_LIST_HEIGHT, window.innerHeight - box.top - LIST_OFFSET - MARGIN_BELOW - bar));
    };

    // Borner ne suffit pas : quand le champ est tout en bas de la fenêtre, il
    // ne reste aucune place à borner et la liste sortirait de l'écran quoi
    // qu'on fasse. On remonte donc le champ pour lui faire de la place, ce qui
    // est aussi ce que le visiteur ferait à la main.
    const box = containerRef.current?.getBoundingClientRect();
    if (box && window.innerHeight - box.top - LIST_OFFSET - MARGIN_BELOW < COMFORTABLE_HEIGHT) {
      window.scrollBy({ top: box.top - HEADER_CLEARANCE, behavior: 'smooth' });
    }

    measure();
    window.addEventListener('resize', measure);
    window.addEventListener('scroll', measure, { passive: true });

    return () => {
      window.removeEventListener('resize', measure);
      window.removeEventListener('scroll', measure);
    };
  }, [open, sheet]);

  // Un clic hors du champ referme la liste sans rien effacer.
  useEffect(() => {
    const onPointerDown = (event: MouseEvent) => {
      if (!containerRef.current?.contains(event.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', onPointerDown);
    return () => document.removeEventListener('mousedown', onPointerDown);
  }, []);

  const goToTrade = (trade: Trade) => {
    setOpen(false);
    setNotFound(null);
    router.push(`/metiers/${trade.slug}${level ? `?niveau=${level}` : ''}`);
  };

  const submit = () => {
    // Champ vide : le visiteur explore, il ne remplit pas un formulaire.
    // L'envoyer vers la liste des métiers vaut mieux que lui opposer une erreur.
    if (term.trim() === '') {
      document.getElementById('metiers')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      return;
    }

    const [best] = suggestions;
    if (best) {
      goToTrade(best);
      return;
    }

    // Un métier absent de la taxonomie ne doit jamais être un cul-de-sac.
    setNotFound(term.trim());
    setOpen(false);
  };

  const onKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
      event.preventDefault();
      if (!open) {
        setOpen(true);
        return;
      }
      const direction = event.key === 'ArrowDown' ? 1 : -1;
      setActive((current) => {
        const next = current + direction;
        if (next < 0) return suggestions.length - 1;
        if (next >= suggestions.length) return 0;
        return next;
      });
      return;
    }

    if (event.key === 'Enter') {
      event.preventDefault();
      const chosen = active >= 0 ? suggestions[active] : undefined;
      if (chosen) goToTrade(chosen);
      else submit();
      return;
    }

    if (event.key === 'Escape') {
      // Referme sans vider : le candidat garde ce qu'il a écrit.
      setOpen(false);
      setActive(-1);
      return;
    }

    if (event.key === 'Tab') {
      setOpen(false);
    }
  };

  return (
    <div
      ref={containerRef}
      className={sheet ? 'fixed inset-0 z-50 flex flex-col gap-3 bg-surface p-4' : `relative ${className}`}
    >
      {sheet && (
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-onSurface">{search.label}</span>
          <Button
            variant="link"
            onClick={() => {
              setOpen(false);
              inputRef.current?.blur();
            }}
            className="font-semibold"
          >
            Annuler
          </Button>
        </div>
      )}

      <div className="flex flex-col gap-2 rounded-2xl border border-outline-variant bg-surface-lowest p-2 shadow-floating sm:flex-row sm:items-center">
        <div className="flex flex-1 items-center gap-2 px-3">
          <span className="material-symbols-outlined text-outline" style={{ fontSize: 22 }} aria-hidden="true">
            search
          </span>
          <label htmlFor={`${listboxId}-input`} className="sr-only">
            {search.label}
          </label>
          <input
            id={`${listboxId}-input`}
            ref={inputRef}
            role="combobox"
            aria-expanded={open}
            aria-controls={listboxId}
            aria-autocomplete="list"
            aria-activedescendant={active >= 0 ? `${listboxId}-option-${active}` : undefined}
            autoComplete="off"
            autoCapitalize="words"
            inputMode="search"
            enterKeyHint="search"
            type="text"
            value={term}
            placeholder={search.placeholder}
            onChange={(event) => {
              setTerm(event.target.value);
              setActive(-1);
              setNotFound(null);
              setOpen(true);
            }}
            onFocus={() => setOpen(true)}
            onKeyDown={onKeyDown}
            // 16px minimum : en dessous, iOS zoome sur le champ au focus.
            className="h-14 w-full bg-transparent text-base font-medium text-onSurface outline-none placeholder:text-outline"
          />
        </div>

        <Button size="lg" onClick={submit} className="px-8 text-base">
          {search.submit}
          <span className="material-symbols-outlined" style={{ fontSize: 18 }} aria-hidden="true">
            arrow_forward
          </span>
        </Button>
      </div>

      <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 px-1">
        <Button
          variant="link"
          onClick={() => setAdvanced((value) => !value)}
          aria-expanded={advanced}
          className="gap-1 font-semibold text-onSurface-variant hover:enabled:text-primary hover:enabled:no-underline"
        >
          <span className="material-symbols-outlined" style={{ fontSize: 16 }} aria-hidden="true">
            tune
          </span>
          {search.advanced}
        </Button>

        <span className="hidden text-sm text-outline sm:inline">
          {search.popularLabel} :{' '}
          {popular.slice(0, 3).map((trade, index) => (
            <span key={trade.slug}>
              {index > 0 && ' · '}
              <Button
                variant="link"
                onClick={() => goToTrade(trade)}
                className="font-semibold text-onSurface-variant underline-offset-2 hover:enabled:text-primary"
              >
                {trade.label.split(' / ')[0]}
              </Button>
            </span>
          ))}
        </span>
      </div>

      {advanced && (
        <div className="mt-3 grid gap-3 rounded-2xl border border-outline-variant bg-surface-lowest p-4 sm:grid-cols-2">
          <div>
            <label htmlFor={`${listboxId}-sector`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
              {search.sectorLabel}
            </label>
            <select
              id={`${listboxId}-sector`}
              value={sector}
              onChange={(event) => setSector(event.target.value)}
              className="h-12 w-full rounded-xl border border-outline bg-surface px-3 text-sm font-medium text-onSurface"
            >
              <option value="">{search.sectorAny}</option>
              {sectors.map((item) => (
                <option key={item} value={item}>
                  {item}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label htmlFor={`${listboxId}-level`} className="mb-1 block text-xs font-bold uppercase tracking-wider text-outline">
              {search.levelLabel}
            </label>
            <select
              id={`${listboxId}-level`}
              value={level}
              onChange={(event) => setLevel(event.target.value)}
              className="h-12 w-full rounded-xl border border-outline bg-surface px-3 text-sm font-medium text-onSurface"
            >
              {search.levelOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {open && suggestions.length > 0 && (
        <ul
          id={listboxId}
          role="listbox"
          aria-label={search.suggestionsLabel}
          style={sheet || maxHeight === null ? undefined : { top: LIST_OFFSET, maxHeight }}
          className={
            sheet
              ? 'flex-1 overflow-y-auto overscroll-contain rounded-2xl border border-outline-variant bg-surface-lowest p-1.5'
              : 'absolute inset-x-0 z-30 overflow-y-auto overscroll-contain rounded-2xl border border-outline-variant bg-surface-lowest p-1.5 shadow-floating'
          }
        >
          {debounced.trim() === '' && (
            <li className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-outline">{search.popularLabel}</li>
          )}
          {suggestions.map((trade, index) => (
            <li
              key={trade.slug}
              id={`${listboxId}-option-${index}`}
              role="option"
              aria-selected={index === active}
              onMouseEnter={() => setActive(index)}
              onMouseDown={(event) => event.preventDefault()}
              onClick={() => goToTrade(trade)}
              // 44px minimum de cible tactile.
              className={`flex min-h-[44px] cursor-pointer items-center gap-3 rounded-xl px-3 py-2.5 ${
                index === active ? 'bg-primary-light' : ''
              }`}
            >
              <span className="material-symbols-outlined text-primary" style={{ fontSize: 20 }} aria-hidden="true">
                {trade.icon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-onSurface">
                  <Highlighted label={trade.label} term={debounced.trim()} />
                </span>
                <span className="block text-xs text-onSurface-variant">
                  {trade.sector} · {content.trades.levelPrefix} {trade.germanLevel}
                </span>
              </span>
              <span className="material-symbols-outlined text-outline" style={{ fontSize: 18 }} aria-hidden="true">
                chevron_right
              </span>
            </li>
          ))}
        </ul>
      )}

      <p className="sr-only" aria-live="polite">
        {open && suggestions.length > 0 ? `${suggestions.length} métiers proposés` : ''}
      </p>

      {failed && (
        <p role="alert" className="mt-3 rounded-xl bg-error-light px-4 py-3 text-sm font-medium text-onError-container">
          {search.errorMessage}{' '}
          <a href="#metiers" className="font-bold underline">
            {search.errorLink}
          </a>
        </p>
      )}

      {notFound && (
        <div className="mt-3 rounded-2xl border border-outline-variant bg-surface-lowest p-4">
          <p className="text-sm font-semibold text-onSurface">
            {search.emptyTitle.replace('{term}', notFound)}
          </p>
          <p className="mt-1 text-sm text-onSurface-variant">{search.emptyBody}</p>
          <div className="mt-3 flex flex-wrap gap-2">
            {popular.slice(0, 3).map((trade) => (
              <Button
                key={trade.slug}
                variant="outline"
                size="sm"
                pill
                onClick={() => goToTrade(trade)}
                className="border-outline-variant px-3 text-onSurface hover:enabled:bg-surface-container"
              >
                {trade.label.split(' / ')[0]}
              </Button>
            ))}
          </div>
          <a
            href="/auth-phone"
            className="mt-3 inline-block text-sm font-bold text-primary underline-offset-2 hover:underline"
          >
            {search.emptyCta}
          </a>
        </div>
      )}
    </div>
  );
}
