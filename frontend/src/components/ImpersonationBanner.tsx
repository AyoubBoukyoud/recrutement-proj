'use client';

import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';

/**
 * La bande affichée pendant qu'un administrateur consulte le compte de
 * quelqu'un d'autre.
 *
 * Toujours visible et impossible à replier, volontairement : une session
 * empruntée qu'on a oublié de rendre est un administrateur qui croit lire ses
 * propres données et écrit dans celles d'un candidat. C'est aussi la seule
 * sortie — la console d'où l'emprunt est parti exige le rôle qu'on vient de
 * quitter, donc sans ce bouton il faudrait redemander un code par WhatsApp.
 */
export function ImpersonationBanner() {
  const { impersonator, user, stopImpersonating } = useAuth();
  const router = useRouter();

  if (!impersonator) return null;

  const back = () => {
    stopImpersonating();
    router.push('/admin/utilisateurs');
  };

  return (
    <div
      role="status"
      className="sticky top-0 z-50 flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-attention/40 bg-attention-light px-4 py-2 text-center text-[13px] font-medium text-on-attention-container"
    >
      <span>
        Session empruntée : vous consultez le compte de{' '}
        <strong>{user?.name || user?.phone}</strong>.
      </span>
      <button
        onClick={back}
        className="rounded-full border border-current px-3 py-1 text-[12px] font-bold transition-colors hover:bg-on-attention-container/10"
      >
        Revenir à mon compte
      </button>
    </div>
  );
}
