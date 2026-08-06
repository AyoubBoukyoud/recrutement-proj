'use client';

import { useNetwork } from '@/context/NetworkContext';
import { useLanguage } from '@/context/LanguageContext';

export function SyncBadge() {
  const { isOnline, pendingCount, isSyncing } = useNetwork();
  const { t } = useLanguage();

  if (isOnline && pendingCount === 0 && !isSyncing) return null;

  return (
    <div className="fixed bottom-5 right-5 z-40 flex items-center gap-2 rounded-full bg-primary-dark px-4 py-2.5 text-onPrimary shadow-floating">
      <span
        className={`material-symbols-outlined text-gold ${isSyncing ? 'animate-spin' : ''}`}
        style={{ fontSize: 16 }}
      >
        {!isOnline ? 'cloud_off' : isSyncing ? 'sync' : 'cloud_done'}
      </span>
      <span className="text-xs font-semibold">
        {pendingCount > 0
          ? t('common:sync.pendingCount', { count: pendingCount })
          : isSyncing
            ? t('common:sync.syncing')
            : t('common:sync.synced')}
      </span>
    </div>
  );
}
