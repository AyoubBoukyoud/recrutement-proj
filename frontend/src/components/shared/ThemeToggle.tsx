'use client';

import { useTheme } from '@/context/ThemeContext';
import { IconButton } from '@/components/shared/Button';

/**
 * Bascule clair/sombre en un clic : pas de menu, un geste direct. Le mode
 * `system` reste un mode valide dans `ThemeContext` (pour qui le choisit
 * explicitement ailleurs), mais ce bouton ne l'expose plus — il alterne
 * toujours entre `light` et `dark` à partir du thème actuellement résolu.
 */
export function ThemeToggle() {
  const { resolvedTheme, setMode } = useTheme();
  const isDark = resolvedTheme === 'dark';

  return (
    <IconButton
      variant="ghost"
      aria-label={isDark ? 'Passer en mode clair' : 'Passer en mode sombre'}
      onClick={() => setMode(isDark ? 'light' : 'dark')}
    >
      <span className="material-symbols-outlined" style={{ fontSize: 22 }}>
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </IconButton>
  );
}
