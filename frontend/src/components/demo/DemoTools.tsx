'use client';

import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { demoRoleForPath } from '@/lib/demoRoles';
import { OPEN_DEMO_ROLES } from './DemoRoleButton';

// Fixture code is downloaded only when an administrator opens presentation tools.
const RoleSwitcher = dynamic(() => import('./DemoRoleSwitcher'), {
  ssr: false,
  loading: () => <div role="status" className="fixed bottom-24 right-4 z-[60] rounded-xl border border-amud-outline-variant bg-amud-surface px-5 py-3 text-sm text-amud-on-surface shadow-xl">Préparation des espaces…</div>,
});

export function DemoTools() {
  const { user, impersonator } = useAuth();
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const close = useCallback(() => setOpen(false), []);
  const allowed = user?.role === 'admin' && !impersonator;
  const isDemo = !!demoRoleForPath(pathname);

  useEffect(() => {
    const show = () => { if (allowed) setOpen(true); };
    window.addEventListener(OPEN_DEMO_ROLES, show);
    return () => window.removeEventListener(OPEN_DEMO_ROLES, show);
  }, [allowed]);

  useEffect(() => { setOpen(false); }, [pathname]);

  if (!allowed || (!open && !isDemo)) return null;
  return <RoleSwitcher open={open} onOpen={() => setOpen(true)} onClose={close} />;
}
