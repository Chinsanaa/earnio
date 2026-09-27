'use client';

import { useSyncExternalStore } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';

function subscribeOnlineStatus(onStoreChange: () => void) {
  window.addEventListener('online', onStoreChange);
  window.addEventListener('offline', onStoreChange);
  return () => {
    window.removeEventListener('online', onStoreChange);
    window.removeEventListener('offline', onStoreChange);
  };
}

function getOnlineSnapshot() {
  return navigator.onLine;
}

function getServerOnlineSnapshot() {
  return true;
}

export function OfflineBanner() {
  const online = useSyncExternalStore(
    subscribeOnlineStatus,
    getOnlineSnapshot,
    getServerOnlineSnapshot
  );
  const { t } = useLanguage();

  if (online) return null;

  return (
    <div
      role="alert"
      className="bg-[color:var(--primary)] px-4 py-2.5 text-center text-sm font-semibold text-primary-foreground"
    >
      {t('offline_message')}
    </div>
  );
}
