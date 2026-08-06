'use client';

import { useEffect, useState } from 'react';
import { useLanguage } from '@/context/LanguageContext';
import { readStorage, writeStorage, STORAGE_KEYS } from '@/lib/storage';

// Ne relance pas l'invite avant ce délai lorsque l'utilisateur l'a explicitement écartée.
const DISMISS_COOLDOWN_MS = 14 * 24 * 60 * 60 * 1000;

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>;
}

function isStandalone(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia?.('(display-mode: standalone)').matches ||
    (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  );
}

function isIos(): boolean {
  if (typeof navigator === 'undefined') return false;
  return /iphone|ipad|ipod/i.test(navigator.userAgent);
}

function wasRecentlyDismissed(): boolean {
  const dismissedAt = readStorage<number | null>(STORAGE_KEYS.installPromptDismissedAt, null);
  return dismissedAt !== null && Date.now() - dismissedAt < DISMISS_COOLDOWN_MS;
}

export function InstallPrompt() {
  const { t } = useLanguage();
  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showIosHint, setShowIosHint] = useState(false);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (isStandalone() || wasRecentlyDismissed()) return;

    const handleBeforeInstallPrompt = (event: Event) => {
      event.preventDefault();
      setDeferredPrompt(event as BeforeInstallPromptEvent);
      setVisible(true);
    };

    const handleAppInstalled = () => {
      setVisible(false);
      setDeferredPrompt(null);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('appinstalled', handleAppInstalled);

    // Safari iOS ne déclenche jamais `beforeinstallprompt` : on affiche une astuce manuelle.
    if (isIos()) {
      setShowIosHint(true);
      setVisible(true);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const dismiss = () => {
    writeStorage(STORAGE_KEYS.installPromptDismissedAt, Date.now());
    setVisible(false);
  };

  const install = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div className="fixed inset-x-0 bottom-0 z-50 mx-auto max-w-md px-4 pb-4">
      <div className="flex items-start gap-3 rounded-card bg-surface-container-lowest p-4 shadow-floating">
        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-pillar bg-primary/10">
          <span className="material-symbols-outlined text-primary" style={{ fontSize: 24 }}>
            install_mobile
          </span>
        </div>

        <div className="flex-1">
          <p className="text-sm font-semibold text-onSurface">{t('common:install.title')}</p>
          <p className="mt-0.5 text-xs text-onSurface-variant">
            {showIosHint ? t('common:install.iosHint') : t('common:install.subtitle')}
          </p>

          <div className="mt-3 flex items-center gap-3">
            {!showIosHint && (
              <button
                type="button"
                onClick={install}
                className="rounded-pillar bg-primary px-4 py-2 text-xs font-semibold text-onPrimary shadow-soft"
              >
                {t('common:install.cta')}
              </button>
            )}
            <button type="button" onClick={dismiss} className="text-xs font-semibold text-outline">
              {t('common:install.dismiss')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
