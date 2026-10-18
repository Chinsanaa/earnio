import authService from './authService';
import notificationService from './notificationService';
import { PLATFORM_FEE_RATE } from './walletService';
import { getAuthenticatedClient, supabaseAdmin } from '../database/supabase';
import { toNumber } from '../utils/toNumber';

/** Ledger rows written when a sponsor marks a campaign as paid (gross credit + 20% fee). */
export interface SponsorshipPaymentLedgerRow {
  user_id: string;
  type: 'sponsorship_credit' | 'platform_fee';
  amount_mnt: number;
  currency: 'MNT';
  status: 'completed';
  description: string;
  reference_type: 'sponsorship';
  reference_id: string;
}

/**
 * Build wallet ledger inserts for one creator payment.
 * Credit is the gross campaign amount; fee is PLATFORM_FEE_RATE of gross
 * (available balance = 80% after both rows land).
 */
export function buildSponsorshipPaymentLedgerRows(params: {
  creatorUserId: string;
  campaignId: string;
  campaignTitle: string;
  paymentAmountMnt: number;
}): SponsorshipPaymentLedgerRow[] {
  const gross = Math.round(params.paymentAmountMnt);
  if (!Number.isFinite(gross) || gross <= 0) {
    throw new Error('Payment amount must be a positive number');
  }
  const fee = Math.round(gross * PLATFORM_FEE_RATE);
  const title = params.campaignTitle.trim() || 'Campaign';

  return [
    {
      user_id: params.creatorUserId,
      type: 'sponsorship_credit',
      amount_mnt: gross,
      currency: 'MNT',
      status: 'completed',
      description: `Sponsorship payment for "${title}"`,
      reference_type: 'sponsorship',
      reference_id: params.campaignId,
    },
    {
      user_id: params.creatorUserId,
      type: 'platform_fee',
      amount_mnt: fee,
      currency: 'MNT',
      status: 'completed',
      description: `Platform fee (20%) for "${title}"`,
      reference_type: 'sponsorship',
      reference_id: params.campaignId,
    },
  ];
}

export interface SponsorDashboardStats {
  activeCampaigns: number;
  totalCampaigns: number;
  pendingApplications: number;
  totalApplications: number;
  totalBudgetMnt: number;
  statusBreakdown: ApplicationStatusBreakdown;
  approvalRate: number | null;
}

export interface ApplicationStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
}

export function buildStatusBreakdown(applications: { status: string }[]): ApplicationStatusBreakdown {
  return {
    pending: applications.filter((a) => a.status === 'pending').length,
    approved: applications.filter((a) => a.status === 'approved').length,
    rejected: applications.filter((a) => a.status === 'rejected').length,
  };
}

export function computeApprovalRate(breakdown: ApplicationStatusBreakdown): number | null {
  const decided = breakdown.approved + breakdown.rejected;
  return decided > 0 ? breakdown.approved / decided : null;
}

export interface CampaignPaymentStatus {
  approvedCount: number;
  submittedCount: number;
  amountDueMnt: number;
  deadlinePassed: boolean;
  allSubmitted: boolean;
  readyToPay: boolean;
  paidAt: string | null;
}

export function computePaymentStatus(
  campaign: SponsorCampaign,
  applications: SponsorApplication[]
): CampaignPaymentStatus {
  const approved = applications.filter((a) => a.status === 'approved');
  const submitted = approved.filter((a) => !!a.deliverable_url);
  const deadlinePassed = !!campaign.deadline_complete && new Date(campaign.deadline_complete) < new Date();
  const allSubmitted = approved.length > 0 && submitted.length === approved.length;

  return {
    approvedCount: approved.length,
    submittedCount: submitted.length,
    amountDueMnt: approved.length * campaign.payment_amount_mnt,
    deadlinePassed,
    allSubmitted,
    readyToPay: !campaign.paymentMarkedPaidAt && deadlinePassed && allSubmitted,
    paidAt: campaign.paymentMarkedPaidAt,
  };
}

export interface SponsorCampaign {
  id: string;
  title: string;
  description: string;
  payment_amount_mnt: number;
  content_type: string | null;
  required_followers_min: number | null;
  required_followers_max: number | null;
  engagement_rate_min: number | null;
  status: string;
  deadline_apply: string | null;
  deadline_complete: string | null;
  created_at: string | null;
  applicationCount: number;
  pendingCount: number;
  paymentMarkedPaidAt: string | null;
}

export interface SponsorApplication {
  id: string;
  sponsorship_id: string;
  status: string;
  response_text: string | null;
  sponsor_notes: string | null;
  applied_at: string | null;
  deliverable_url: string | null;
  deliverable_submitted_at: string | null;
  creator: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
}

export interface CampaignPayload {
  title: string;
  description: string;
  paymentAmountMnt: number;
  contentType?: string;
  requiredFollowersMin?: number;
  requiredFollowersMax?: number;
  engagementRateMin?: number;
  deadlineApply?: string;
  deadlineComplete?: string;
}

type CampaignRow = {
  id: string;
  title: string;
  description: string;
  payment_amount_mnt: string | number;
  content_type: string | null;
  required_followers_min: number | null;
  required_followers_max: number | null;
  engagement_rate_min: string | number | null;
  status: string;
  deadline_apply: string | null;
  deadline_complete: string | null;
  created_at: string | null;
  payment_marked_paid_at?: string | null;
};

const CAMPAIGN_COLUMNS =
  'id, title, description, payment_amount_mnt, content_type, required_followers_min, required_followers_max, engagement_rate_min, status, deadline_apply, deadline_complete, created_at, payment_marked_paid_at';

function mapCampaignRow(
  row: CampaignRow,
  counts: { total: number; pending: number } = { total: 0, pending: 0 }
): SponsorCampaign {
  return {
    id: row.id,
    title: row.title,
    description: row.description,
    payment_amount_mnt: toNumber(row.payment_amount_mnt),
    content_type: row.content_type,
    required_followers_min: row.required_followers_min,
    required_followers_max: row.required_followers_max,
    engagement_rate_min:
      row.engagement_rate_min != null ? toNumber(row.engagement_rate_min) : null,
    status: row.status,
    deadline_apply: row.deadline_apply,
    deadline_complete: row.deadline_complete,
    created_at: row.created_at,
    applicationCount: counts.total,
    pendingCount: counts.pending,
    paymentMarkedPaidAt: row.payment_marked_paid_at ?? null,
  };
}

export function validateCampaignPayload(payload: CampaignPayload): void {
  const { title, description, paymentAmountMnt } = payload;
  if (!title?.trim() || !description?.trim()) {
    throw new Error('Title and description are required');
  }
  if (!paymentAmountMnt || paymentAmountMnt < 10000) {
    throw new Error('Minimum payment is 10,000 MNT');
  }
}

function campaignInsertFromPayload(userId: string, payload: CampaignPayload) {
  return {
    sponsor_user_id: userId,
    title: payload.title.trim(),
    description: payload.description.trim(),
    payment_amount_mnt: payload.paymentAmountMnt,
    content_type: payload.contentType ?? 'tiktok_video',
    required_followers_min: payload.requiredFollowersMin ?? null,
    required_followers_max: payload.requiredFollowersMax ?? null,
    engagement_rate_min: payload.engagementRateMin ?? null,
    status: 'active',
    deadline_apply: payload.deadlineApply ?? null,
    deadline_complete: payload.deadlineComplete ?? null,
  };
}

class SponsorService {
  private async assertSponsor(userId: string, accessToken: string): Promise<void> {
    const profile = await authService.getProfile(userId, accessToken);
    if (profile.userType !== 'sponsor') {
      throw new Error('Sponsor account required');
    }
  }

  // Runs a read-only query concurrently with the sponsor-role check instead of
  // serializing the two round trips. The role-check failure takes priority so
  // non-sponsors still get the 403-style error.
  private async assertSponsorAlongside<T>(
    userId: string,
    accessToken: string,
    work: PromiseLike<T>
  ): Promise<T> {
    const [assertResult, workResult] = await Promise.allSettled([
      this.assertSponsor(userId, accessToken),
      work,
    ]);
    if (assertResult.status === 'rejected') throw assertResult.reason;
    if (workResult.status === 'rejected') throw workResult.reason;
    return workResult.value;
  }

  public async getDashboard(
    userId: string,
    accessToken: string
  ): Promise<SponsorDashboardStats> {
    const client = getAuthenticatedClient(accessToken);

    const { data: campaigns, error } = await this.assertSponsorAlongside(
      userId,
      accessToken,
      client.from('sponsorships').select('id, status, payment_amount_mnt').eq('sponsor_user_id', userId)
    );

    if (error) {
      throw new Error(`Failed to load dashboard: ${error.message}`);
    }

    const rows = campaigns ?? [];
    const campaignIds = rows.map((r) => r.id);

    let applications: { status: string }[] = [];
    if (campaignIds.length > 0) {
      const { data: apps } = await client
        .from('sponsorship_applications')
        .select('status')
        .in('sponsorship_id', campaignIds);
      applications = apps ?? [];
    }

    const statusBreakdown = buildStatusBreakdown(applications);

    return {
      activeCampaigns: rows.filter((r) => r.status === 'active').length,
      totalCampaigns: rows.length,
      pendingApplications: statusBreakdown.pending,
      totalApplications: applications.length,
      totalBudgetMnt: rows
        .filter((r) => r.status === 'active')
        .reduce((sum, r) => sum + toNumber(r.payment_amount_mnt), 0),
      statusBreakdown,
      approvalRate: computeApprovalRate(statusBreakdown),
    };
  }

  public async listCampaigns(
    userId: string,
    accessToken: string
  ): Promise<SponsorCampaign[]> {
    const client = getAuthenticatedClient(accessToken);

    const { data: campaigns, error } = await this.assertSponsorAlongside(
      userId,
      accessToken,
      client
        .from('sponsorships')
        .select(CAMPAIGN_COLUMNS)
        .eq('sponsor_user_id', userId)
        .order('created_at', { ascending: false })
    );

    if (error) {
      throw new Error(`Failed to load campaigns: ${error.message}`);
    }

    const ids = (campaigns ?? []).map((c) => c.id);
    const appCounts = new Map<string, { total: number; pending: number }>();

    if (ids.length > 0) {
      const { data: apps } = await client
        .from('sponsorship_applications')
        .select('sponsorship_id, status')
        .in('sponsorship_id', ids);

      for (const app of apps ?? []) {
        const current = appCounts.get(app.sponsorship_id) ?? { total: 0, pending: 0 };
        current.total += 1;
        if (app.status === 'pending') current.pending += 1;
        appCounts.set(app.sponsorship_id, current);
      }
    }

    return (campaigns ?? []).map((row) => {
      const counts = appCounts.get(row.id) ?? { total: 0, pending: 0 };
      return mapCampaignRow(row, counts);
    });
  }

  public async createCampaign(
    userId: string,
    accessToken: string,
    payload: CampaignPayload
  ): Promise<SponsorCampaign> {
    await this.assertSponsor(userId, accessToken);
    validateCampaignPayload(payload);

    const client = getAuthenticatedClient(accessToken);

    const { data, error } = await client
      .from('sponsorships')
      .insert(campaignInsertFromPayload(userId, payload))
      .select(
        CAMPAIGN_COLUMNS
      )
      .single();

    if (error) {
      throw new Error(`Failed to create campaign: ${error.message}`);
    }

    return mapCampaignRow(data);
  }

  public async deleteCampaign(
    userId: string,
    accessToken: string,
    campaignId: string
  ): Promise<void> {
    await this.assertSponsor(userId, accessToken);
    const client = getAuthenticatedClient(accessToken);

    const { data: campaign, error: findError } = await client
      .from('sponsorships')
      .select('id, status')
      .eq('id', campaignId)
      .eq('sponsor_user_id', userId)
      .single();

    if (findError || !campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.status === 'closed') {
      throw new Error('Closed campaigns cannot be deleted');
    }

    const { count, error: countError } = await client
      .from('sponsorship_applications')
      .select('id', { count: 'exact', head: true })
      .eq('sponsorship_id', campaignId);

    if (countError) {
      throw new Error(`Failed to check applications: ${countError.message}`);
    }

    if ((count ?? 0) > 0) {
      throw new Error('Cannot delete a campaign that has applications');
    }

    const { error } = await client
      .from('sponsorships')
      .delete()
      .eq('id', campaignId)
      .eq('sponsor_user_id', userId);

    if (error) {
      throw new Error(`Failed to delete campaign: ${error.message}`);
    }
  }

  public async updateCampaignStatus(
    userId: string,
    accessToken: string,
    campaignId: string,
    status: 'active' | 'closed'
  ): Promise<void> {
    await this.assertSponsor(userId, accessToken);
    const client = getAuthenticatedClient(accessToken);

    const { data: existing, error: findError } = await client
      .from('sponsorships')
      .select('id, status, title, description, payment_amount_mnt')
      .eq('id', campaignId)
      .eq('sponsor_user_id', userId)
      .single();

    if (findError || !existing) {
      throw new Error('Campaign not found');
    }

    if (status === 'active') {
      if (existing.status !== 'draft') {
        throw new Error('Only draft campaigns can be published');
      }
      validateCampaignPayload({
        title: existing.title,
        description: existing.description,
        paymentAmountMnt: toNumber(existing.payment_amount_mnt),
      });
    }

    if (status === 'closed' && existing.status !== 'active') {
      throw new Error('Only active campaigns can be closed');
    }

    const { error } = await client
      .from('sponsorships')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('id', campaignId)
      .eq('sponsor_user_id', userId);

    if (error) {
      throw new Error(`Failed to update campaign: ${error.message}`);
    }
  }

  public async getCampaignApplications(
    userId: string,
    accessToken: string,
    campaignId: string
  ): Promise<{
    campaign: SponsorCampaign;
    applications: SponsorApplication[];
    statusBreakdown: ApplicationStatusBreakdown;
    approvalRate: number | null;
    payment: CampaignPaymentStatus;
  }> {
    const client = getAuthenticatedClient(accessToken);

    const { data: campaign, error: campError } = await this.assertSponsorAlongside(
      userId,
      accessToken,
      client
        .from('sponsorships')
        .select(CAMPAIGN_COLUMNS)
        .eq('id', campaignId)
        .eq('sponsor_user_id', userId)
        .single()
    );

    if (campError || !campaign) {
      throw new Error('Campaign not found');
    }

    const { data: apps, error: appsError } = await client
      .from('sponsorship_applications')
      .select(
        'id, sponsorship_id, status, response_text, sponsor_notes, applied_at, creator_user_id, deliverable_url, deliverable_submitted_at'
      )
      .eq('sponsorship_id', campaignId)
      .order('applied_at', { ascending: false });

    if (appsError) {
      throw new Error(`Failed to load applications: ${appsError.message}`);
    }

    const creatorIds = [...new Set((apps ?? []).map((a) => a.creator_user_id))];
    const creatorMap = new Map<string, { id: string; name: string; username: string; email: string }>();

    if (creatorIds.length > 0 && supabaseAdmin) {
      const { data: creators } = await supabaseAdmin
        .from('users')
        .select('id, name, username, email')
        .in('id', creatorIds);
      for (const c of creators ?? []) {
        creatorMap.set(c.id, c);
      }
    }

    const applications: SponsorApplication[] = (apps ?? []).map((app) => ({
      id: app.id,
      sponsorship_id: app.sponsorship_id,
      status: app.status,
      response_text: app.response_text,
      sponsor_notes: app.sponsor_notes,
      applied_at: app.applied_at,
      deliverable_url: app.deliverable_url,
      deliverable_submitted_at: app.deliverable_submitted_at,
      creator: creatorMap.get(app.creator_user_id) ?? null,
    }));

    const statusBreakdown = buildStatusBreakdown(applications);
    const mappedCampaign = mapCampaignRow(campaign, {
      total: applications.length,
      pending: statusBreakdown.pending,
    });

    return {
      campaign: mappedCampaign,
      applications,
      statusBreakdown,
      approvalRate: computeApprovalRate(statusBreakdown),
      payment: computePaymentStatus(mappedCampaign, applications),
    };
  }

  public async markCampaignPaid(
    userId: string,
    accessToken: string,
    campaignId: string
  ): Promise<SponsorCampaign> {
    await this.assertSponsor(userId, accessToken);
    const client = getAuthenticatedClient(accessToken);

    const { data: campaign, error: findError } = await client
      .from('sponsorships')
      .select(CAMPAIGN_COLUMNS)
      .eq('id', campaignId)
      .eq('sponsor_user_id', userId)
      .single();

    if (findError || !campaign) {
      throw new Error('Campaign not found');
    }

    if (campaign.payment_marked_paid_at) {
      throw new Error('Payment has already been marked as paid');
    }

    const { data: apps, error: appsError } = await client
      .from('sponsorship_applications')
      .select('status, deliverable_url, creator_user_id')
      .eq('sponsorship_id', campaignId);

    if (appsError) {
      throw new Error(`Failed to load applications: ${appsError.message}`);
    }

    const approved = (apps ?? []).filter((a) => a.status === 'approved');
    if (approved.length === 0) {
      throw new Error('No approved applicants to pay');
    }
    if (approved.some((a) => !a.deliverable_url)) {
      throw new Error('All approved applicants must submit their deliverable before paying');
    }

    if (!supabaseAdmin) {
      throw new Error('Payment processing is temporarily unavailable');
    }

    // Claim the campaign first: only one request can flip payment_marked_paid_at
    // from null, so concurrent clicks cannot both credit wallets. The unique
    // index on sponsorship ledger rows is a second line of defence.
    const { data, error } = await client
      .from('sponsorships')
      .update({ payment_marked_paid_at: new Date().toISOString() })
      .eq('id', campaignId)
      .is('payment_marked_paid_at', null)
      .select(CAMPAIGN_COLUMNS)
      .maybeSingle();

    if (error) {
      throw new Error(`Failed to mark campaign as paid: ${error.message}`);
    }
    if (!data) {
      throw new Error('Payment has already been marked as paid');
    }

    const gross = toNumber(campaign.payment_amount_mnt);
    const campaignTitle = campaign.title ?? 'Campaign';
    const ledgerRows = approved.flatMap((app) =>
      buildSponsorshipPaymentLedgerRows({
        creatorUserId: app.creator_user_id,
        campaignId,
        campaignTitle,
        paymentAmountMnt: gross,
      })
    );

    const { error: ledgerError } = await supabaseAdmin
      .from('wallet_transactions')
      .insert(ledgerRows);

    if (ledgerError) {
      // A unique violation means these creators were already credited, so the
      // campaign really is paid; keep the claim. Otherwise release it to retry.
      if (ledgerError.code === '23505') {
        throw new Error('Payment has already been marked as paid');
      }
      await client
        .from('sponsorships')
        .update({ payment_marked_paid_at: null })
        .eq('id', campaignId);
      throw new Error(`Failed to credit creator wallets: ${ledgerError.message}`);
    }

    const netPerCreator = Math.round(gross * (1 - PLATFORM_FEE_RATE));
    await Promise.all(
      approved.map((app) =>
        notificationService.notifySponsorshipPaid(
          app.creator_user_id,
          campaignTitle,
          netPerCreator
        )
      )
    );

    return mapCampaignRow(data, {
      total: apps?.length ?? 0,
      pending: (apps ?? []).filter((a) => a.status === 'pending').length,
    });
  }

  public async updateApplicationStatus(
    userId: string,
    accessToken: string,
    applicationId: string,
    status: 'approved' | 'rejected',
    sponsorNotes?: string
  ): Promise<SponsorApplication> {
    await this.assertSponsor(userId, accessToken);
    const client = getAuthenticatedClient(accessToken);

    const { data: app, error: findError } = await client
      .from('sponsorship_applications')
      .select('id, sponsorship_id, status')
      .eq('id', applicationId)
      .single();

    if (findError || !app) {
      throw new Error('Application not found');
    }

    const { data: campaign } = await client
      .from('sponsorships')
      .select('id')
      .eq('id', app.sponsorship_id)
      .eq('sponsor_user_id', userId)
      .single();

    if (!campaign) {
      throw new Error('Not authorized to manage this application');
    }

    if (app.status !== 'pending') {
      throw new Error('Only pending applications can be updated');
    }

    const updatePayload: Record<string, unknown> = {
      status,
      sponsor_notes: sponsorNotes?.trim() || null,
      updated_at: new Date().toISOString(),
    };
    if (status === 'approved') {
      updatePayload.approved_at = new Date().toISOString();
    }

    const { data, error } = await client
      .from('sponsorship_applications')
      .update(updatePayload)
      .eq('id', applicationId)
      .select(
        'id, sponsorship_id, status, response_text, sponsor_notes, applied_at, creator_user_id, deliverable_url, deliverable_submitted_at'
      )
      .single();

    if (error) {
      throw new Error(`Failed to update application: ${error.message}`);
    }

    let creator = null;
    if (supabaseAdmin) {
      const [{ data: c }, { data: camp }] = await Promise.all([
        supabaseAdmin
          .from('users')
          .select('id, name, username, email')
          .eq('id', data.creator_user_id)
          .single(),
        supabaseAdmin
          .from('sponsorships')
          .select('title')
          .eq('id', data.sponsorship_id)
          .single(),
      ]);
      creator = c;

      await notificationService.notifyApplicationStatus(
        data.creator_user_id,
        status,
        camp?.title ?? 'Campaign',
        sponsorNotes
      );
    }

    return {
      id: data.id,
      sponsorship_id: data.sponsorship_id,
      status: data.status,
      response_text: data.response_text,
      sponsor_notes: data.sponsor_notes,
      applied_at: data.applied_at,
      deliverable_url: data.deliverable_url,
      deliverable_submitted_at: data.deliverable_submitted_at,
      creator,
    };
  }
}

export default new SponsorService();
