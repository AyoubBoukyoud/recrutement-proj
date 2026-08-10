'use client';

import { useNetwork } from '@/context/NetworkContext';

export function SyncBadge() {
  const { isOnline, pendingCount, isSyncing } = useNetwork();

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
        {pendingCount > 0 ? `${pendingCount} en attente` : isSyncing ? 'Synchronisation…' : 'Synchronisé'}
      </span>
    </div>
  );
}
