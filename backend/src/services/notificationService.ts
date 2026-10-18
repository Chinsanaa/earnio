import { getAuthenticatedClient, supabaseAdmin } from '../database/supabase';
import emailService from './emailService';

export interface NotificationRow {
  id: string;
  type: string;
  title: string;
  body: string;
  metadata: Record<string, unknown> | null;
  read_at: string | null;
  created_at: string;
}

class NotificationService {
  public async create(
    userId: string,
    type: string,
    title: string,
    body: string,
    metadata?: Record<string, unknown>
  ): Promise<void> {
    if (!supabaseAdmin) return;

    const { error } = await supabaseAdmin.from('notifications').insert({
      user_id: userId,
      type,
      title,
      body,
      metadata: metadata ?? null,
    });

    if (error) {
      console.error('Failed to create notification:', error.message);
      return;
    }

    // Email delivery is best-effort; don't block the caller's request on it.
    void this.sendEmailForUser(userId, type, title, body).catch((err) => {
      console.error('Failed to send notification email:', err);
    });
  }

  private async sendEmailForUser(
    userId: string,
    type: string,
    title: string,
    body: string
  ): Promise<void> {
    if (!emailService.isConfigured() || !supabaseAdmin) return;

    const { data: user, error } = await supabaseAdmin
      .from('users')
      .select('email, name')
      .eq('id', userId)
      .single();

    if (error || !user?.email) {
      console.error('Could not load user email for notification:', error?.message);
      return;
    }

    await emailService.sendNotificationEmail({
      to: user.email,
      userName: user.name,
      title,
      body,
      type,
    });
  }

  public async notifyApplicationStatus(
    creatorUserId: string,
    status: 'approved' | 'rejected',
    campaignTitle: string,
    sponsorNotes?: string
  ): Promise<void> {
    const title =
      status === 'approved' ? 'Sponsorship approved' : 'Sponsorship application update';
    const body =
      status === 'approved'
        ? `Your application for "${campaignTitle}" was approved.`
        : `Your application for "${campaignTitle}" was not selected this time.`;
    const note = sponsorNotes?.trim();
    await this.create(creatorUserId, `application_${status}`, title, note ? `${body} Note: ${note}` : body, {
      campaignTitle,
      status,
    });
  }

  public async notifyEarningsSynced(
    userId: string,
    platform: string,
    amountMnt: number
  ): Promise<void> {
    await this.create(
      userId,
      'earnings_synced',
      'Earnings synced',
      `New ${platform} earnings (₮${amountMnt.toLocaleString()}) were added to your dashboard.`,
      { platform, amountMnt }
    );
  }

  public async notifyPayoutRequested(
    userId: string,
    amountMnt: number
  ): Promise<void> {
    await this.create(
      userId,
      'payout_requested',
      'Payout requested',
      `Your withdrawal of ₮${amountMnt.toLocaleString()} is being processed.`,
      { amountMnt }
    );
  }

  public async notifyNewApplication(
    sponsorUserId: string,
    campaignTitle: string
  ): Promise<void> {
    await this.create(
      sponsorUserId,
      'application_received',
      'New application',
      `A creator applied to "${campaignTitle}". Review it from your campaign page.`,
      { campaignTitle }
    );
  }

  public async notifyDeliverableSubmitted(
    sponsorUserId: string,
    campaignTitle: string
  ): Promise<void> {
    await this.create(
      sponsorUserId,
      'deliverable_submitted',
      'Deliverable submitted',
      `A creator submitted their post for "${campaignTitle}". Review and approve it to release payment.`,
      { campaignTitle }
    );
  }

  public async notifyDeliverableApproved(
    creatorUserId: string,
    campaignTitle: string
  ): Promise<void> {
    await this.create(
      creatorUserId,
      'deliverable_approved',
      'Deliverable approved',
      `The brand approved your post for "${campaignTitle}". Payment is released when the campaign is marked paid.`,
      { campaignTitle }
    );
  }

  public async notifySponsorshipPaid(
    creatorUserId: string,
    campaignTitle: string,
    netAmountMnt: number
  ): Promise<void> {
    await this.create(
      creatorUserId,
      'sponsorship_paid',
      'Sponsorship payment received',
      `₮${netAmountMnt.toLocaleString()} from "${campaignTitle}" was added to your wallet.`,
      { campaignTitle, netAmountMnt }
    );
  }

  public async list(
    userId: string,
    accessToken: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{
    notifications: NotificationRow[];
    unreadCount: number;
    hasMore: boolean;
    nextOffset: number;
  }> {
    const client = getAuthenticatedClient(accessToken);
    const limit = Math.min(Math.max(options.limit ?? 30, 1), 100);
    const offset = Math.max(0, options.offset ?? 0);

    // One extra row signals hasMore without a separate count query.
    const { data, error } = await client
      .from('notifications')
      .select('id, type, title, body, metadata, read_at, created_at')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .range(offset, offset + limit);

    if (error) {
      throw new Error(`Failed to load notifications: ${error.message}`);
    }

    const rows = (data ?? []) as NotificationRow[];
    const hasMore = rows.length > limit;
    const notifications = hasMore ? rows.slice(0, limit) : rows;

    // Reflects the current page (sufficient for the bell's badge given the cap).
    const unreadCount = notifications.filter((n) => !n.read_at).length;
    return { notifications, unreadCount, hasMore, nextOffset: offset + notifications.length };
  }

  public async markRead(
    userId: string,
    accessToken: string,
    notificationId: string
  ): Promise<void> {
    const client = getAuthenticatedClient(accessToken);
    const { error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('id', notificationId)
      .eq('user_id', userId);

    if (error) {
      throw new Error(`Failed to mark notification read: ${error.message}`);
    }
  }

  public async markAllRead(userId: string, accessToken: string): Promise<void> {
    const client = getAuthenticatedClient(accessToken);
    const { error } = await client
      .from('notifications')
      .update({ read_at: new Date().toISOString() })
      .eq('user_id', userId)
      .is('read_at', null);

    if (error) {
      throw new Error(`Failed to mark all read: ${error.message}`);
    }
  }
}

export default new NotificationService();
