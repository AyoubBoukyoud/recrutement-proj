'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/amud/ui';
import { DEMO_ROLES, demoRoleForPath, type DemoRole } from '@/lib/demoRoles';
import { preparePresentation, selectPresentationCandidate } from '@/lib/amud/preparePresentation';

export default function DemoRoleSwitcher({ open, onOpen, onClose }: {
  open: boolean; onOpen: () => void; onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const active = demoRoleForPath(pathname);
  const [error, setError] = useState('');
  const [target, setTarget] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    try {
      preparePresentation();
      // Warm dashboard bundles while the presenter chooses a role.
      for (const role of DEMO_ROLES) router.prefetch(role.path);
      router.prefetch('/admin');
    } catch {
      setError('Le stockage du navigateur est indisponible. Autorisez-le pour préparer les données de démonstration.');
    }
  }, [open, router]);

  function select(role: DemoRole) {
    if (active?.id === role.id) { onClose(); return; }
    try {
      setError('');
      preparePresentation();
      if (role.id === 'candidate') selectPresentationCandidate();
      setTarget(role.label);
      startTransition(() => router.push(role.path));
    } catch {
      setError('Impossible de préparer la démonstration. Vérifiez que le stockage du navigateur est autorisé.');
    }
  }

  return createPortal(
    <>
      {active && (
        <div aria-label="Commandes de présentation" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[45] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-amud-primary/20 bg-amud-surface p-2 text-amud-on-surface shadow-xl md:bottom-5 md:right-5">
          <button type="button" onClick={onOpen} aria-haspopup="dialog" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-amud-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amud-primary">
            <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">swap_horiz</span>
            <span><span className="block text-[10px] font-bold uppercase tracking-wider text-amud-primary">Démo · données fictives</span><span className="block text-sm font-semibold">{active.label} <span aria-hidden="true">⌄</span></span></span>
          </button>
          <button type="button" onClick={() => router.push('/admin')} title="Quitter la présentation et revenir à l’administration" className="min-h-11 rounded-xl border border-amud-outline-variant px-3 text-xs font-semibold hover:bg-amud-surface-container-low">Retour admin</button>
        </div>
      )}
      <Modal open={open} onClose={onClose} title="Changer de rôle" subtitle="Présentation commerciale" widthClassName="max-w-2xl">
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-amud-primary/5 p-4 text-sm text-amud-on-surface-variant">
          <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">play_circle</span>
          <p>Explorez chaque espace avec des données de test. Votre session administrateur reste disponible à tout moment.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy={pending}>
          {DEMO_ROLES.map((role) => (
            <button key={role.id} type="button" disabled={pending} onClick={() => select(role)} aria-current={active?.id === role.id ? 'true' : undefined}
              className={`flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary disabled:opacity-60 ${active?.id === role.id ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant bg-amud-surface hover:border-amud-primary hover:bg-amud-primary/5'}`}>
              <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amud-primary/10 text-amud-primary" aria-hidden="true">{role.icon}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-amud-on-surface">{role.label}</span><span className="mt-1 block text-xs leading-relaxed text-amud-on-surface-variant">{role.description}</span></span>
              {active?.id === role.id && <span className="material-symbols-outlined text-lg text-amud-primary" aria-label="Rôle actif">check_circle</span>}
            </button>
          ))}
        </div>
        <p role="status" className="mt-4 text-center text-xs text-amud-on-surface-variant">{pending ? `Ouverture de l’espace ${target}…` : '7 espaces prêts à présenter · Modifications conservées dans ce navigateur'}</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-amud-error-container p-3 text-sm text-amud-error">{error}</p>}
      </Modal>
    </>, document.body,
  );
}
