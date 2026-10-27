'use client';

import { useAuth } from '@/context/AuthContext';

export const OPEN_DEMO_ROLES = 'amud:open-demo-roles';

export function DemoRoleButton({ collapsed = false }: { collapsed?: boolean }) {
  const { user, isLoading, impersonator } = useAuth();
  if (isLoading || user?.role !== 'admin' || impersonator) return null;
  return (
    <button
      type="button"
      onClick={() => window.dispatchEvent(new Event(OPEN_DEMO_ROLES))}
      title="Changer de rôle · Démonstration"
      aria-haspopup="dialog"
      className="mb-2 flex min-h-11 w-full items-center gap-3 rounded-xl border border-amud-primary/20 bg-amud-primary/5 px-3 py-3 text-left text-amud-primary transition-colors hover:bg-amud-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary"
    >
      <span className="material-symbols-outlined shrink-0" aria-hidden="true">swap_horiz</span>
      <span className={collapsed ? 'md:hidden md:group-hover:block' : ''}>
        <span className="block text-sm font-semibold">Changer de rôle</span>
        <span className="block text-xs opacity-75">Présentation · 7 espaces</span>
      </span>
    </button>
  );
}
