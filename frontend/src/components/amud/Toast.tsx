'use client';

import { ReactNode, createContext, useCallback, useContext, useEffect, useState } from 'react';

/**
 * Système de notification toast partagé par les 13 pages `/amud/admin/*`.
 * Remplace le patch "bannière colorée inline + setTimeout" que 5 pages
 * réimplémentaient chacune de leur côté (roles-permissions, objectifs,
 * commerciaux/[id], parametres, commerciaux/nouveau). Monté une seule fois
 * au niveau d'`AdminShell`, donc les toasts survivent à une navigation
 * client (ex: création d'un commercial → redirection vers son profil).
 */
type ToastVariant = 'success' | 'error' | 'info' | 'warning';
type ToastItem = { id: number; message: string; variant: ToastVariant };

const ICONS: Record<ToastVariant, string> = {
  success: 'check_circle',
  error: 'error',
  info: 'info',
  warning: 'warning',
};

const STYLES: Record<ToastVariant, string> = {
  success: 'border-amud-primary-fixed-dim bg-amud-primary-fixed text-amud-on-primary-fixed',
  error: 'border-amud-error/30 bg-amud-error-container text-amud-on-error-container',
  info: 'border-amud-outline-variant bg-amud-surface-container-lowest text-amud-on-surface',
  warning: 'border-amud-tertiary-fixed-dim bg-amud-tertiary-fixed text-amud-on-tertiary-fixed',
};

let uid = 0;

const ToastContext = createContext<((message: string, variant?: ToastVariant) => void) | null>(null);

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<ToastItem[]>([]);

  const dismiss = useCallback((id: number) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const notify = useCallback((message: string, variant: ToastVariant = 'success') => {
    const id = ++uid;
    setToasts((prev) => [...prev, { id, message, variant }]);
  }, []);

  return (
    <ToastContext.Provider value={notify}>
      {children}
      <div className="pointer-events-none fixed bottom-6 right-6 z-[100] flex w-full max-w-sm flex-col gap-sm">
        {toasts.map((t) => (
          <ToastCard key={t.id} toast={t} onDone={() => dismiss(t.id)} />
        ))}
      </div>
    </ToastContext.Provider>
  );
}

function ToastCard({ toast, onDone }: { toast: ToastItem; onDone: () => void }) {
  useEffect(() => {
    const t = setTimeout(onDone, 3400);
    return () => clearTimeout(t);
  }, [onDone]);

  return (
    <div className={`pointer-events-auto flex items-start gap-sm rounded-lg border px-4 py-3 text-body-md shadow-lg animate-amud-slide-in-right ${STYLES[toast.variant]}`}>
      <span className="material-symbols-outlined mt-0.5 shrink-0 text-[20px]">{ICONS[toast.variant]}</span>
      <span className="flex-1">{toast.message}</span>
      <button onClick={onDone} aria-label="Fermer la notification" className="shrink-0 opacity-70 transition-opacity hover:opacity-100">
        <span className="material-symbols-outlined text-[18px]">close</span>
      </button>
    </div>
  );
}

/** À appeler depuis n'importe quelle page `/amud/admin/*` (ToastProvider est monté dans AdminShell). */
export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast() doit être utilisé sous <ToastProvider> (AdminShell le fournit déjà).');
  return ctx;
}
