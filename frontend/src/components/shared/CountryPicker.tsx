'use client';

// Sélecteur d'indicatif. Le bouton est rendu immédiatement ; la fenêtre de
// recherche (Base UI + liste de tous les pays nommés dans la langue active) est
// chargée pendant un temps mort du navigateur, ou au premier survol / focus,
// pour ne pas alourdir le premier affichage de la page de connexion.

import { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { countryByIso, flagEmoji } from '@/lib/countries';

const loadDialog = () => import('./CountryPickerDialog');
const CountryPickerDialog = dynamic(() => loadDialog().then((module) => module.CountryPickerDialog), { ssr: false });

export function CountryPicker({
  value,
  onChange,
  label,
}: {
  /** Code ISO du pays choisi. */
  value: string;
  onChange: (iso: string) => void;
  label: string;
}) {
  const [open, setOpen] = useState(false);
  // Monté une fois ouvert, puis conservé : la fermeture rend le focus au bouton.
  const [mounted, setMounted] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const selected = countryByIso(value);

  useEffect(() => {
    if (typeof window.requestIdleCallback === 'function') {
      const id = window.requestIdleCallback(() => void loadDialog(), { timeout: 4000 });
      return () => window.cancelIdleCallback(id);
    }
    const id = window.setTimeout(() => void loadDialog(), 2000);
    return () => window.clearTimeout(id);
  }, []);

  const preload = useCallback(() => void loadDialog(), []);

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        aria-label={`${label} : ${selected.dial}`}
        aria-haspopup="dialog"
        aria-expanded={open}
        onPointerEnter={preload}
        onFocus={preload}
        onClick={() => {
          setMounted(true);
          setOpen(true);
        }}
        className="flex shrink-0 cursor-pointer items-center gap-1 rounded-md border-none bg-transparent p-0 text-sm font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-primary"
      >
        <span aria-hidden="true">{flagEmoji(selected.iso)}</span>
        <span dir="ltr">{selected.dial}</span>
        <span className="material-symbols-outlined" aria-hidden="true" style={{ fontSize: 18 }}>
          expand_more
        </span>
      </button>
      {mounted && (
        <CountryPickerDialog
          open={open}
          onOpenChange={setOpen}
          value={selected.iso}
          triggerRef={triggerRef}
          onChoose={(iso) => {
            onChange(iso);
            setOpen(false);
          }}
        />
      )}
    </>
  );
}
