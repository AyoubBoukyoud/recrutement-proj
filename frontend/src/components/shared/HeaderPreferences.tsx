'use client';

import { LanguageSwitcher } from '@/components/shared/LanguageSwitcher';
import { ThemeToggle } from '@/components/shared/ThemeToggle';

/**
 * The same compact language and light/dark controls for every application
 * header. Keeping the pair together prevents individual pages from drifting
 * back to different pills, labels, or toggle switches.
 */
export function HeaderPreferences({ className = '' }: { className?: string }) {
  return (
    <div className={`flex shrink-0 items-center gap-1 ${className}`} role="group" aria-label="Langue et apparence">
      <LanguageSwitcher compact />
      <ThemeToggle />
    </div>
  );
}
