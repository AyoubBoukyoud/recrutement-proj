'use client';

import { useNetwork } from '@/context/NetworkContext';
import { useLanguage } from '@/context/LanguageContext';

export function OfflineBanner() {
  const { isOnline } = useNetwork();
  const { t } = useLanguage();

  if (isOnline) return null;

  return (
    <div className="sticky top-0 z-40 flex w-full items-center justify-center gap-2 bg-gold px-4 py-2 text-center text-xs font-semibold text-onGold shadow-md">
      <span className="material-symbols-outlined" style={{ fontSize: 16 }}>
        cloud_off
      </span>
      {t('offline_banner')}
    </div>
  );
}
