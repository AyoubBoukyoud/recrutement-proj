'use client';

import { useEffect, useRef, useState } from 'react';
import { useTheme } from '@/context/ThemeContext';
import type { ThemeMode } from '@/lib/types';
import { IconButton } from '@/components/shared/Button';

const THEME_OPTIONS: { mode: ThemeMode; label: string; icon: string }[] = [
  { mode: 'light', label: 'Clair', icon: 'light_mode' },
  { mode: 'dark', label: 'Sombre', icon: 'dark_mode' },
  { mode: 'system', label: 'Système', icon: 'brightness_auto' },
];

/** Bouton icône + menu clair/sombre/système, même idiome que `LanguageSwitcher`. */
export function ThemeToggle() {
  const { mode, setMode } = useTheme();
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const current = THEME_OPTIONS.find((t) => t.mode === mode) ?? THEME_OPTIONS[2];

  useEffect(() => {
    if (!isOpen) return;
    function onClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setIsOpen(false);
    }
    document.addEventListener('mousedown', onClick);
    return () => document.removeEventListener('mousedown', onClick);
  }, [isOpen]);

  return (
    <div ref={ref} className="relative">
      <IconButton
        variant="ghost"
        aria-label="Changer de thème"
        aria-haspopup="menu"
        aria-expanded={isOpen}
        onClick={() => setIsOpen((v) => !v)}
      >
        <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
          {current.icon}
        </span>
      </IconButton>

      {isOpen ? (
        <>
          <div className="fixed inset-0 z-10" onClick={() => setIsOpen(false)} />
          <div className="absolute end-0 z-20 mt-2 w-40 overflow-hidden rounded-xl border border-outline-variant bg-surface-lowest shadow-floating">
            {THEME_OPTIONS.map((opt) => (
              <button
                key={opt.mode}
                type="button"
                onClick={() => {
                  setMode(opt.mode);
                  setIsOpen(false);
                }}
                className={`flex w-full items-center gap-2 px-3 py-2.5 text-left text-xs font-medium hover:bg-surface-container ${
                  opt.mode === mode ? 'bg-primary-light font-bold text-onPrimary-container' : 'text-onSurface'
                }`}
              >
                <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
                  {opt.icon}
                </span>
                <span>{opt.label}</span>
              </button>
            ))}
          </div>
        </>
      ) : null}
    </div>
  );
}
