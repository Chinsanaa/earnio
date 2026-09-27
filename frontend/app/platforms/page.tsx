'use client';

import { useCallback, useEffect, useState } from 'react';
import { CreatorPageHeader } from '@/components/creator/CreatorPageHeader';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { PlatformBadge } from '@/components/dashboard/PlatformBadge';
import { PlatformsSkeleton } from '@/components/platforms/PlatformsSkeleton';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { getDashboardSummary } from '@/lib/api/dashboard';
import {
  listPlatforms,
  listSyncHistory,
  syncPlatform,
  disconnectPlatform,
  getTikTokAuthUrl,
  getYouTubeAuthUrl,
  getInstagramAuthUrl,
} from '@/lib/api/platforms';
import { formatDate, formatHandle, formatMnt, platformLabel } from '@/lib/format';
import type { PlatformEarnings } from '@/lib/types/dashboard';
import type { PlatformAccount, SyncHistoryEntry } from '@/lib/types/platforms';

const PLATFORMS = [
  { id: 'tiktok', label: 'TikTok' },
  { id: 'youtube', label: 'YouTube' },
  { id: 'instagram', label: 'Instagram' },
] as const;

export default function PlatformsPage() {
  const [accounts, setAccounts] = useState<PlatformAccount[]>([]);
  const [history, setHistory] = useState<SyncHistoryEntry[]>([]);
  const [earnings, setEarnings] = useState<PlatformEarnings[]>([]);
  const [syncingId, setSyncingId] = useState<string | null>(null);
  const [connectingPlatform, setConnectingPlatform] = useState<string | null>(null);
  const [disconnectingId, setDisconnectingId] = useState<string | null>(null);
  const [confirmRemoveId, setConfirmRemoveId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const { t } = useLanguage();

  const load = useCallback(async (isCancelled: () => boolean = () => false) => {
    setError(null);
    try {
      const [accs, hist, summary] = await Promise.all([
        listPlatforms(),
        listSyncHistory(),
        getDashboardSummary(),
      ]);
      if (!isCancelled()) {
        setAccounts(accs.filter((a) => a.status === 'connected'));
        setHistory(hist);
        setEarnings(summary.byPlatform);
      }
    } catch (err) {
      if (!isCancelled()) {
        setError(err instanceof ApiError ? err.message : t('failed_to_load_platforms'));
      }
    } finally {
      if (!isCancelled()) {
        setLoading(false);
      }
    }
  }, [t]);

  useEffect(() => {
    let cancelled = false;
    void load(() => cancelled);
    return () => {
      cancelled = true;
    };
  }, [load]);

  async function handleOAuthConnect(platformId: string) {
    setConnectingPlatform(platformId);
    setError(null);
    setMessage(null);
    try {
      let authUrl: string;

      if (platformId === 'tiktok') {
        const response = await getTikTokAuthUrl();
        authUrl = response.authUrl;
      } else if (platformId === 'youtube') {
        const response = await getYouTubeAuthUrl();
        authUrl = response.authUrl;
      } else if (platformId === 'instagram') {
        const response = await getInstagramAuthUrl();
        authUrl = response.authUrl;
      } else {
        throw new Error('Unknown platform');
      }

      // Use window.location in a safe way via a microtask
      void Promise.resolve().then(() => {
        window.location.href = authUrl;
      });
    } catch (err) {
      setError(err instanceof ApiError ? err.message : `Failed to initiate ${platformId} connection`);
      setConnectingPlatform(null);
    }
  }

  async function handleDisconnect(accountId: string) {
    setDisconnectingId(accountId);
    setError(null);
    setMessage(null);
    try {
      await disconnectPlatform(accountId);
      setConfirmRemoveId(null);
      setMessage(t('disconnect_completed'));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('disconnect_failed'));
    } finally {
      setDisconnectingId(null);
    }
  }

  async function handleSync(accountId: string) {
    setSyncingId(accountId);
    setError(null);
    setMessage(null);
    try {
      await syncPlatform(accountId);
      setMessage(t('sync_completed'));
      await load();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : t('sync_failed'));
    } finally {
      setSyncingId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-5xl">
        <CreatorPageHeader
          title={t('platforms')}
          subtitle={t('connect_platforms_subtitle')}
        />

        {message && <p className="mb-4 alert-success">{message}</p>}
        {error && (
          <p className="mb-4 alert-error">{error}</p>
        )}

        {loading ? (
          <PlatformsSkeleton />
        ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {PLATFORMS.map((platform) => {
            const account = accounts.find((a) => a.platform.toLowerCase() === platform.id);
            const isConnecting = connectingPlatform === platform.id;
            const platformEarnings = earnings.find((e) => e.platform.toLowerCase() === platform.id);
            const isSynced = account?.status === 'connected';

            return (
              <div key={platform.id} className="creator-panel-lg flex flex-col gap-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3">
                    <PlatformBadge platform={platform.id} />
                    <div>
                      <p className="font-display text-lg font-bold tracking-tight text-landing-fg">{platform.label}</p>
                      <p className="text-xs text-landing-muted">
                        {account ? formatHandle(account.platform_username) : 'Not connected'}
                      </p>
                    </div>
                  </div>
                  {account && (
                    <span
                      className={`shrink-0 ${isSynced ? 'badge-status-success' : 'badge-status-neutral'}`}
                    >
                      {isSynced ? t('synced') : t('off')}
                    </span>
                  )}
                </div>

                {account ? (
                  <>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="creator-platform-stat">
                        <p className="text-xs text-landing-muted">{t('followers')}</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-landing-fg">
                          {(account.follower_count ?? 0).toLocaleString()}
                        </p>
                      </div>
                      <div className="creator-platform-stat">
                        <p className="text-xs text-landing-muted">{t('total_earned')}</p>
                        <p className="mt-1 font-mono text-sm font-semibold text-landing-fg">
                          {formatMnt(platformEarnings?.totalMnt ?? 0)}
                        </p>
                      </div>
                    </div>
                    <div className="mt-1 flex items-center justify-between gap-3 border-t-2 border-[color:var(--border)] pt-3">
                      <p className="text-xs text-landing-muted">
                        {account.last_synced_at
                          ? `${t('last_synced')}: ${formatDate(account.last_synced_at)}`
                          : t('never_synced')}
                      </p>
                      <button
                        type="button"
                        disabled={syncingId === account.id}
                        onClick={() => handleSync(account.id)}
                        className="landing-btn-light px-4 py-2 text-xs"
                      >
                        {syncingId === account.id ? t('syncing') : t('sync_now')}
                      </button>
                    </div>

                    {confirmRemoveId === account.id ? (
                      <div className="creator-remove-confirm">
                        <p className="text-xs text-landing-muted">{t('remove_account_confirm')}</p>
                        <div className="flex items-center gap-2">
                          <button
                            type="button"
                            onClick={() => setConfirmRemoveId(null)}
                            className="landing-btn-light px-3 py-1.5 text-xs"
                          >
                            {t('cancel')}
                          </button>
                          <button
                            type="button"
                            disabled={disconnectingId === account.id}
                            onClick={() => handleDisconnect(account.id)}
                            className="creator-remove-confirm-btn"
                          >
                            {disconnectingId === account.id ? t('removing') : t('confirm_remove')}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setConfirmRemoveId(account.id)}
                        className="creator-remove-link"
                      >
                        {t('remove_account')}
                      </button>
                    )}
                  </>
                ) : (
                  <button
                    type="button"
                    disabled={isConnecting}
                    onClick={() => handleOAuthConnect(platform.id)}
                    className="landing-btn-dark px-4 py-2 text-xs"
                  >
                    {isConnecting ? 'Connecting...' : `${t('connect')} ${platform.label}`}
                  </button>
                )}
              </div>
            );
          })}
        </div>
        )}

        {history.length > 0 && (
          <section className="creator-panel-lg mt-6">
            <h2 className="font-display text-xl font-bold tracking-tight text-landing-fg">{t('sync_history')}</h2>
            <ul className="mt-4 space-y-2">
              {history.slice(0, 6).map((h) => (
                <li key={h.id} className="creator-platform-row">
                  <span className="text-landing-fg">
                    {platformLabel(h.platform)} · {h.status}
                  </span>
                  <span className="shrink-0 text-landing-muted">{formatDate(h.started_at)}</span>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}
