'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { enqueue, processQueue, subscribeQueue } from '@/lib/syncQueue';
import type { SyncActionType } from '@/lib/types';

interface NetworkContextValue {
  isOnline: boolean;
  pendingCount: number;
  isSyncing: boolean;
  queueAction: (type: SyncActionType, payload: Record<string, unknown>) => void;
  syncNow: () => Promise<void>;
}

const NetworkContext = createContext<NetworkContextValue | undefined>(undefined);

export function NetworkProvider({ children }: { children: React.ReactNode }) {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);

  const syncNow = useCallback(async () => {
    setIsSyncing(true);
    try {
      await processQueue();
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    setIsOnline(typeof navigator !== 'undefined' ? navigator.onLine : true);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);
    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    const unsubscribe = subscribeQueue((queue) => setPendingCount(queue.length));

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
      unsubscribe();
    };
  }, []);

  useEffect(() => {
    if (isOnline && pendingCount > 0) {
      syncNow();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOnline]);

  const queueAction = useCallback((type: SyncActionType, payload: Record<string, unknown>) => {
    enqueue(type, payload);
  }, []);

  const value = useMemo(
    () => ({ isOnline, pendingCount, isSyncing, queueAction, syncNow }),
    [isOnline, pendingCount, isSyncing, queueAction, syncNow]
  );

  return <NetworkContext.Provider value={value}>{children}</NetworkContext.Provider>;
}

export function useNetwork(): NetworkContextValue {
  const ctx = useContext(NetworkContext);
  if (!ctx) throw new Error('useNetwork doit être utilisé à l\'intérieur de <NetworkProvider>');
  return ctx;
}
