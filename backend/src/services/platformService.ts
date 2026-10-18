import {
  fetchPlatformData,
  isSupportedPlatform,
  type SupportedPlatform,
} from '../platforms/mockPlatformProvider';
import { getAuthenticatedClient, supabaseAdmin } from '../database/supabase';
import notificationService from './notificationService';

export interface PlatformAccount {
  id: string;
  platform: string;
  platform_username: string;
  follower_count: number | null;
  status: string | null;
  last_synced_at: string | null;
}

export interface SyncHistoryRow {
  id: string;
  platform: string;
  sync_type: string;
  status: string;
  records_synced: number | null;
  error_message: string | null;
  started_at: string | null;
  completed_at: string | null;
}

const SYNC_STALE_HOURS = 24;

class PlatformService {
  public async listAccounts(userId: string, accessToken: string): Promise<PlatformAccount[]> {
    const client = getAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from('platform_accounts')
      .select('id, platform, platform_username, follower_count, status, last_synced_at')
      .eq('user_id', userId)
      .order('platform', { ascending: true });

    if (error) {
      throw new Error(`Failed to load platforms: ${error.message}`);
    }

    return (data ?? []) as PlatformAccount[];
  }

  public async connect(
    userId: string,
    accessToken: string,
    platform: string,
    platformUsername: string
  ): Promise<PlatformAccount> {
    if (!isSupportedPlatform(platform)) {
      throw new Error('Platform must be tiktok, youtube, or instagram');
    }

    const username = platformUsername.trim().replace(/^@/, '');
    if (!username) {
      throw new Error('Platform username is required');
    }

    const platformUserId = `live_${userId}_${platform}`;
    const client = getAuthenticatedClient(accessToken);

    const { data: existing } = await client
      .from('platform_accounts')
      .select('id')
      .eq('user_id', userId)
      .eq('platform', platform)
      .maybeSingle();

    if (existing) {
      const { data, error } = await client
        .from('platform_accounts')
        .update({
          platform_username: `@${username}`,
          platform_user_id: platformUserId,
          status: 'connected',
          updated_at: new Date().toISOString(),
        })
        .eq('id', existing.id)
        .select('id, platform, platform_username, follower_count, status, last_synced_at')
        .single();

      if (error) {
        throw new Error(`Failed to update platform: ${error.message}`);
      }
      return data as PlatformAccount;
    }

    const { data, error } = await client
      .from('platform_accounts')
      .insert({
        user_id: userId,
        platform,
        platform_username: `@${username}`,
        platform_user_id: platformUserId,
        status: 'connected',
        follower_count: 0,
      })
      .select('id, platform, platform_username, follower_count, status, last_synced_at')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('This platform account is already linked to another user');
      }
      throw new Error(`Failed to connect platform: ${error.message}`);
    }

    return data as PlatformAccount;
  }

  public async disconnect(
    userId: string,
    accessToken: string,
    accountId: string
  ): Promise<PlatformAccount> {
    const client = getAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from('platform_accounts')
      .update({
        status: 'disconnected',
        updated_at: new Date().toISOString(),
      })
      .eq('id', accountId)
      .eq('user_id', userId)
      .select('id, platform, platform_username, follower_count, status, last_synced_at')
      .single();

    if (error || !data) {
      throw new Error('Failed to disconnect platform account');
    }

    return data as PlatformAccount;
  }

  public async syncAccount(
    userId: string,
    accessToken: string,
    accountId: string
  ): Promise<{ recordsSynced: number; earningsMnt: number }> {
    const client = getAuthenticatedClient(accessToken);
    const { data: account, error: findError } = await client
      .from('platform_accounts')
      .select('id, platform, platform_user_id, platform_username, status')
      .eq('id', accountId)
      .eq('user_id', userId)
      .single();

    if (findError || !account) {
      throw new Error('Platform account not found');
    }

    if (account.status !== 'connected') {
      throw new Error('Platform is not connected');
    }

    return this.runSyncForAccount(userId, account.id, account.platform as SupportedPlatform, account.platform_user_id, client);
  }

  public async listSyncHistory(
    userId: string,
    accessToken: string,
    limit = 20
  ): Promise<SyncHistoryRow[]> {
    const client = getAuthenticatedClient(accessToken);
    const { data, error } = await client
      .from('api_syncs')
      .select('id, platform, sync_type, status, records_synced, error_message, started_at, completed_at')
      .eq('user_id', userId)
      .order('started_at', { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to load sync history: ${error.message}`);
    }

    return (data ?? []) as SyncHistoryRow[];
  }

  public async runScheduledSyncAll(): Promise<{ synced: number; failed: number }> {
    if (!supabaseAdmin) {
      console.warn('Scheduled sync skipped: SUPABASE_SERVICE_ROLE_KEY not set');
      return { synced: 0, failed: 0 };
    }

    const staleBeforeMs = Date.now() - SYNC_STALE_HOURS * 60 * 60 * 1000;

    const { data: accounts, error } = await supabaseAdmin
      .from('platform_accounts')
      .select('id, user_id, platform, platform_user_id, last_synced_at')
      .eq('status', 'connected');

    if (error) {
      console.error('Scheduled sync list failed:', error.message);
      return { synced: 0, failed: 0 };
    }

    const due = (accounts ?? []).filter((a) => {
      if (!a.last_synced_at) return true;
      return new Date(a.last_synced_at).getTime() < staleBeforeMs;
    });

    let synced = 0;
    let failed = 0;

    for (const account of due) {
      try {
        await this.runSyncForAccount(
          account.user_id,
          account.id,
          account.platform as SupportedPlatform,
          account.platform_user_id,
          supabaseAdmin
        );
        synced += 1;
      } catch (err) {
        failed += 1;
        console.error(`Sync failed for account ${account.id}:`, err);
      }
    }

    return { synced, failed };
  }

  private async runSyncForAccount(
    userId: string,
    accountId: string,
    platform: SupportedPlatform,
    platformUserId: string,
    client: ReturnType<typeof getAuthenticatedClient>
  ): Promise<{ recordsSynced: number; earningsMnt: number }> {
    const startedAt = new Date().toISOString();
    const logPlatform = platform;

    if (!supabaseAdmin) {
      throw new Error('Platform sync is temporarily unavailable. Please try again later.');
    }

    const earningsClient = supabaseAdmin;

    try {
      // Demo build: platform stats always come from the mock provider.
      const payload = fetchPlatformData(platform, platformUserId);

      const { data: existingEarning } = await earningsClient
        .from('earnings')
        .select('id, amount_mnt')
        .eq('user_id', userId)
        .eq('platform', platform)
        .eq('period_start', payload.periodStart)
        .eq('period_end', payload.periodEnd)
        .eq('source_type', 'ad_revenue')
        .maybeSingle();

      let recordsSynced = 0;
      let earningsMnt = 0;

      if (existingEarning) {
        await earningsClient
          .from('earnings')
          .update({
            amount_mnt: payload.earningsMnt,
            amount_usd: payload.amountUsd,
            synced_from_api: true,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existingEarning.id)
          .eq('user_id', userId);
        earningsMnt = payload.earningsMnt;
      } else {
        const { error: earnError } = await earningsClient.from('earnings').insert({
          user_id: userId,
          platform,
          amount_mnt: payload.earningsMnt,
          amount_usd: payload.amountUsd,
          currency: 'MNT',
          period_start: payload.periodStart,
          period_end: payload.periodEnd,
          source_type: 'ad_revenue',
          synced_from_api: true,
        });

        if (earnError) {
          throw new Error(earnError.message);
        }
        recordsSynced = 1;
        earningsMnt = payload.earningsMnt;
      }

      // Update platform account with latest data
      const updateData: Record<string, unknown> = {
        follower_count: payload.followerCount,
        last_synced_at: new Date().toISOString(),
        status: 'connected',
        updated_at: new Date().toISOString(),
      };

      await client.from('platform_accounts').update(updateData).eq('id', accountId);

      const { error: syncLogError } = await client.from('api_syncs').insert({
        user_id: userId,
        platform: logPlatform,
        sync_type: 'earnings',
        status: 'success',
        records_synced: recordsSynced,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });

      if (syncLogError) {
        console.error('Failed to write sync log:', syncLogError.message);
      }

      if (recordsSynced > 0) {
        await notificationService.notifyEarningsSynced(userId, platform, earningsMnt);
      }

      return { recordsSynced, earningsMnt };
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Sync failed';
      const { error: syncLogError } = await client.from('api_syncs').insert({
        user_id: userId,
        platform: logPlatform,
        sync_type: 'earnings',
        status: 'failed',
        records_synced: 0,
        error_message: message,
        started_at: startedAt,
        completed_at: new Date().toISOString(),
      });

      if (syncLogError) {
        console.error('Failed to write sync log:', syncLogError.message);
      }

      throw err;
    }
  }
}

export default new PlatformService();
