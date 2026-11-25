'use client';

import { usePathname, useRouter } from 'next/navigation';
import { useEffect, useState, useTransition } from 'react';
import { createPortal } from 'react-dom';
import { Modal } from '@/components/amud/ui';
import { DEMO_ROLES, demoRoleForPath, type DemoRole } from '@/lib/demoRoles';
import { preparePresentation, selectPresentationCandidate } from '@/lib/amud/preparePresentation';
import { endPresentation, startPresentation } from '@/lib/amud/presentationActions';
import { hasPresentationAccess } from '@/lib/amud/presentationAccess';
import { useAuth } from '@/context/AuthContext';
import { apiPost } from '@/lib/api';

/** Real accounts on the live API (unlike the presentation roles), hidden from recruiters. */
const TEST_CANDIDATES = [
  { variant: 'complete', label: 'Candidat · profil complet', icon: 'how_to_reg', description: 'Dossier soumis, allemand B1 déclaré : test de langue, offres, candidatures', path: '/dashboard' },
  { variant: 'incomplete', label: 'Candidat · profil incomplet', icon: 'person_add', description: 'Dossier vide, remis à zéro à chaque ouverture : création du profil', path: '/profile-creation?step=1' },
] as const;

type TestCandidate = (typeof TEST_CANDIDATES)[number];

export default function DemoRoleSwitcher({ open, onOpen, onClose }: {
  open: boolean; onOpen: () => void; onClose: () => void;
}) {
  const router = useRouter();
  const pathname = usePathname();
  const { token, impersonate } = useAuth();
  const active = demoRoleForPath(pathname);
  const [error, setError] = useState('');
  const [target, setTarget] = useState('');
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    if (!open) return;
    try {
      preparePresentation();
      // Warm dashboard bundles only once the server will serve them: a prefetch
      // made before the grant would cache the proxy's redirect.
      if (hasPresentationAccess()) for (const role of DEMO_ROLES) router.prefetch(role.path);
      router.prefetch('/admin');
    } catch {
      setError('Le stockage du navigateur est indisponible. Autorisez-le pour préparer les données de démonstration.');
    }
  }, [open, router]);

  async function select(role: DemoRole) {
    if (active?.id === role.id) { onClose(); return; }
    try {
      setError('');
      preparePresentation();
      if (role.id === 'candidate') selectPresentationCandidate();
    } catch {
      setError('Impossible de préparer la démonstration. Vérifiez que le stockage du navigateur est autorisé.');
      return;
    }
    setTarget(role.label);
    if (hasPresentationAccess()) { startTransition(() => router.push(role.path)); return; }
    try {
      // The server only serves prototype pages to a browser holding a signed grant.
      if (!token) throw new Error('Session administrateur requise.');
      await startPresentation(token);
    } catch (failure) {
      setTarget('');
      setError(failure instanceof Error && failure.message ? `Présentation non autorisée : ${failure.message}` : 'Présentation non autorisée.');
      return;
    }
    // Full navigation: the client router may hold redirects cached before the grant existed.
    window.location.assign(role.path);
  }

  async function openTestCandidate(candidate: TestCandidate) {
    if (!token) { setError('Session administrateur requise.'); return; }
    setError('');
    setTarget(candidate.label);
    try {
      const { token: candidateToken, user } = await apiPost<{
        token: string; user: { id: number; name: string | null; phone: string | null; roles: string[] };
      }>(`/admin/test-candidates/${candidate.variant}`, {}, token);
      if (active) await endPresentation();
      impersonate(candidateToken, { id: String(user.id), role: 'candidate', name: user.name ?? candidate.label, phone: user.phone, roles: user.roles });
    } catch (failure) {
      setTarget('');
      setError(failure instanceof Error && failure.message ? `Ouverture impossible : ${failure.message}` : 'Ouverture impossible.');
      return;
    }
    // Full navigation, so the candidate space loads with the new session from scratch.
    window.location.assign(candidate.path);
  }

  return createPortal(
    <>
      {active && (
        <div aria-label="Commandes de présentation" className="fixed bottom-[calc(5.5rem+env(safe-area-inset-bottom))] right-3 z-[45] flex max-w-[calc(100vw-1.5rem)] items-center gap-2 rounded-2xl border border-amud-primary/20 bg-amud-surface p-2 text-amud-on-surface shadow-xl md:bottom-5 md:right-5">
          <button type="button" onClick={onOpen} aria-haspopup="dialog" className="flex min-h-11 items-center gap-2 rounded-xl px-3 text-left transition-colors hover:bg-amud-primary/10 focus-visible:outline focus-visible:outline-2 focus-visible:outline-amud-primary">
            <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">swap_horiz</span>
            <span><span className="block text-[10px] font-bold uppercase tracking-wider text-amud-primary">Démo · données fictives</span><span className="block text-sm font-semibold">{active.label} <span aria-hidden="true">⌄</span></span></span>
          </button>
          <button type="button" onClick={() => { void endPresentation().then(() => window.location.assign('/admin')); }} title="Quitter la présentation et revenir à l’administration" className="min-h-11 rounded-xl border border-amud-outline-variant px-3 text-xs font-semibold hover:bg-amud-surface-container-low">Retour admin</button>
        </div>
      )}
      <Modal open={open} onClose={onClose} title="Changer de rôle" subtitle="Présentation commerciale" widthClassName="max-w-2xl">
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-amud-primary/5 p-4 text-sm text-amud-on-surface-variant">
          <span className="material-symbols-outlined text-amud-primary" aria-hidden="true">play_circle</span>
          <p>Explorez chaque espace avec des données de test. Votre session administrateur reste disponible à tout moment.</p>
        </div>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy={pending}>
          {DEMO_ROLES.map((role) => (
            <button key={role.id} type="button" disabled={pending} onClick={() => void select(role)} aria-current={active?.id === role.id ? 'true' : undefined}
              className={`flex min-h-24 items-start gap-3 rounded-xl border p-4 text-left transition-colors focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary disabled:opacity-60 ${active?.id === role.id ? 'border-amud-primary bg-amud-primary/5' : 'border-amud-outline-variant bg-amud-surface hover:border-amud-primary hover:bg-amud-primary/5'}`}>
              <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amud-primary/10 text-amud-primary" aria-hidden="true">{role.icon}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-amud-on-surface">{role.label}</span><span className="mt-1 block text-xs leading-relaxed text-amud-on-surface-variant">{role.description}</span></span>
              {active?.id === role.id && <span className="material-symbols-outlined text-lg text-amud-primary" aria-label="Rôle actif">check_circle</span>}
            </button>
          ))}
        </div>
        <h3 className="mb-1 mt-6 text-sm font-semibold text-amud-on-surface">Comptes de test réels</h3>
        <p className="mb-3 text-xs text-amud-on-surface-variant">Vraie application candidat et vraies données (test de langue compris). Invisibles pour les recruteurs ; « Revenir à mon compte », en haut de l’écran, ramène à l’administration.</p>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2" aria-busy={pending}>
          {TEST_CANDIDATES.map((candidate) => (
            <button key={candidate.variant} type="button" disabled={pending || target !== ''} onClick={() => void openTestCandidate(candidate)}
              className="flex min-h-24 items-start gap-3 rounded-xl border border-amud-outline-variant bg-amud-surface p-4 text-left transition-colors hover:border-amud-primary hover:bg-amud-primary/5 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-amud-primary disabled:opacity-60">
              <span className="material-symbols-outlined flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-amud-primary/10 text-amud-primary" aria-hidden="true">{candidate.icon}</span>
              <span className="min-w-0 flex-1"><span className="block text-sm font-semibold text-amud-on-surface">{candidate.label}</span><span className="mt-1 block text-xs leading-relaxed text-amud-on-surface-variant">{candidate.description}</span></span>
            </button>
          ))}
        </div>
        <p role="status" className="mt-4 text-center text-xs text-amud-on-surface-variant">{pending || target ? `Ouverture de l’espace ${target}…` : '7 espaces prêts à présenter · Modifications conservées dans ce navigateur'}</p>
        {error && <p role="alert" className="mt-3 rounded-lg bg-amud-error-container p-3 text-sm text-amud-error">{error}</p>}
      </Modal>
    </>, document.body,
  );
}
