import { apiFetch } from './client';
import type { PlatformAccount, SyncHistoryEntry } from '@/lib/types/platforms';

export async function listPlatforms(): Promise<PlatformAccount[]> {
  const data = await apiFetch<{ accounts: PlatformAccount[] }>('/api/platforms');
  return data.accounts;
}

export async function connectPlatform(
  platform: string,
  platformUsername: string
): Promise<PlatformAccount> {
  const data = await apiFetch<{ account: PlatformAccount }>('/api/platforms/connect', {
    method: 'POST',
    body: JSON.stringify({ platform, platformUsername }),
  });
  return data.account;
}

export async function syncPlatform(accountId: string): Promise<void> {
  await apiFetch(`/api/platforms/${accountId}/sync`, { method: 'POST' });
}

export async function disconnectPlatform(accountId: string): Promise<void> {
  await apiFetch(`/api/platforms/${accountId}/disconnect`, { method: 'POST' });
}

export async function listSyncHistory(): Promise<SyncHistoryEntry[]> {
  const data = await apiFetch<{ history: SyncHistoryEntry[] }>('/api/platforms/sync/history');
  return data.history;
}
