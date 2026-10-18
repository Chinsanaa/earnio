import { getAuthenticatedClient, supabaseAdmin } from '../database/supabase';
import { normalizeDeliverableUrl } from '../utils/validate';
import notificationService from './notificationService';
import { toNumber } from '../utils/toNumber';

export interface SponsorInfo {
  id: string;
  name: string;
  username: string;
}

export interface SponsorshipListing {
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
  sponsor: SponsorInfo | null;
  hasApplied: boolean;
  applicationStatus: string | null;
}

export interface SponsorshipApplication {
  id: string;
  sponsorship_id: string;
  status: string;
  response_text: string | null;
  applied_at: string | null;
  deliverable_url: string | null;
  deliverable_submitted_at: string | null;
  deliverable_approved_at: string | null;
  sponsorship: {
    id: string;
    title: string;
    payment_amount_mnt: number;
    status: string;
    deadline_complete: string | null;
  } | null;
}

class SponsorshipService {
  private async enrichSponsors<T extends { sponsor_user_id: string }>(
    rows: T[]
  ): Promise<Map<string, SponsorInfo>> {
    const map = new Map<string, SponsorInfo>();
    if (!rows.length || !supabaseAdmin) return map;

    const ids = [...new Set(rows.map((r) => r.sponsor_user_id))];
    const { data } = await supabaseAdmin
      .from('users')
      .select('id, name, username')
      .in('id', ids);

    for (const u of data ?? []) {
      map.set(u.id, { id: u.id, name: u.name, username: u.username });
    }
    return map;
  }

  public async listActive(
    userId: string,
    accessToken: string,
    options: { limit?: number; offset?: number } = {}
  ): Promise<{ items: SponsorshipListing[]; hasMore: boolean; nextOffset: number }> {
    const client = getAuthenticatedClient(accessToken);
    const limit = Math.min(Math.max(options.limit ?? 50, 1), 100);
    const offset = Math.max(0, options.offset ?? 0);

    // One extra row signals hasMore without a separate count query.
    const [sponsorshipsResult, applicationsResult] = await Promise.all([
      client
        .from('sponsorships')
        .select(
          'id, sponsor_user_id, title, description, payment_amount_mnt, content_type, required_followers_min, required_followers_max, engagement_rate_min, status, deadline_apply, deadline_complete, created_at'
        )
        .eq('status', 'active')
        .order('created_at', { ascending: false })
        .range(offset, offset + limit),
      client
        .from('sponsorship_applications')
        .select('sponsorship_id, status')
        .eq('creator_user_id', userId),
    ]);

    if (sponsorshipsResult.error) {
      throw new Error(`Failed to load sponsorships: ${sponsorshipsResult.error.message}`);
    }

    if (applicationsResult.error) {
      throw new Error(`Failed to load applications: ${applicationsResult.error.message}`);
    }

    const applicationMap = new Map<string, string>();
    for (const app of applicationsResult.data ?? []) {
      applicationMap.set(app.sponsorship_id, app.status);
    }

    const allRows = sponsorshipsResult.data ?? [];
    const hasMore = allRows.length > limit;
    const rows = hasMore ? allRows.slice(0, limit) : allRows;
    const sponsorMap = await this.enrichSponsors(rows);

    const items = rows.map((row) => ({
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
      sponsor: sponsorMap.get(row.sponsor_user_id) ?? null,
      hasApplied: applicationMap.has(row.id),
      applicationStatus: applicationMap.get(row.id) ?? null,
    }));

    return { items, hasMore, nextOffset: offset + items.length };
  }

  public async getById(
    sponsorshipId: string,
    userId: string,
    accessToken: string
  ): Promise<SponsorshipListing> {
    const client = getAuthenticatedClient(accessToken);

    const { data: row, error } = await client
      .from('sponsorships')
      .select(
        'id, sponsor_user_id, title, description, payment_amount_mnt, content_type, required_followers_min, required_followers_max, engagement_rate_min, status, deadline_apply, deadline_complete, created_at'
      )
      .eq('id', sponsorshipId)
      .eq('status', 'active')
      .single();

    if (error || !row) {
      throw new Error('Sponsorship not found');
    }

    const { data: application } = await client
      .from('sponsorship_applications')
      .select('status')
      .eq('sponsorship_id', sponsorshipId)
      .eq('creator_user_id', userId)
      .maybeSingle();

    const sponsorMap = await this.enrichSponsors([row]);

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
      sponsor: sponsorMap.get(row.sponsor_user_id) ?? null,
      hasApplied: !!application,
      applicationStatus: application?.status ?? null,
    };
  }

  public async apply(
    sponsorshipId: string,
    userId: string,
    accessToken: string,
    responseText: string
  ): Promise<{ id: string; status: string }> {
    if (!responseText?.trim()) {
      throw new Error('Application message is required');
    }

    const client = getAuthenticatedClient(accessToken);

    const { data: profile } = await client
      .from('users')
      .select('user_type')
      .eq('id', userId)
      .single();

    if (profile?.user_type !== 'creator') {
      throw new Error('Only creator accounts can apply to sponsorships');
    }

    const { data: sponsorship, error: loadError } = await client
      .from('sponsorships')
      .select('id, sponsor_user_id, title, status, deadline_apply, required_followers_min')
      .eq('id', sponsorshipId)
      .single();

    if (loadError || !sponsorship) {
      throw new Error('Sponsorship not found');
    }

    if (sponsorship.status !== 'active') {
      throw new Error('This sponsorship is no longer accepting applications');
    }

    if (sponsorship.deadline_apply) {
      const deadline = new Date(sponsorship.deadline_apply);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      if (deadline < today) {
        throw new Error('Application deadline has passed');
      }
    }

    if (sponsorship.required_followers_min) {
      const { data: accounts } = await client
        .from('platform_accounts')
        .select('follower_count')
        .eq('user_id', userId)
        .eq('status', 'connected');
      const topFollowers = Math.max(0, ...(accounts ?? []).map((a) => a.follower_count ?? 0));
      if (topFollowers < sponsorship.required_followers_min) {
        throw new Error(
          `This sponsorship requires at least ${sponsorship.required_followers_min.toLocaleString()} followers on one platform`
        );
      }
    }

    const { data: existing } = await client
      .from('sponsorship_applications')
      .select('id')
      .eq('sponsorship_id', sponsorshipId)
      .eq('creator_user_id', userId)
      .maybeSingle();

    if (existing) {
      throw new Error('You have already applied to this sponsorship');
    }

    const { data, error } = await client
      .from('sponsorship_applications')
      .insert({
        sponsorship_id: sponsorshipId,
        creator_user_id: userId,
        status: 'pending',
        response_text: responseText.trim(),
        applied_at: new Date().toISOString(),
      })
      .select('id, status')
      .single();

    if (error) {
      if (error.code === '23505') {
        throw new Error('You have already applied to this sponsorship');
      }
      throw new Error(`Failed to submit application: ${error.message}`);
    }

    await notificationService.notifyNewApplication(
      sponsorship.sponsor_user_id,
      sponsorship.title ?? 'Campaign'
    );

    return { id: data.id, status: data.status };
  }

  public async listMyApplications(
    userId: string,
    accessToken: string
  ): Promise<SponsorshipApplication[]> {
    const client = getAuthenticatedClient(accessToken);

    const { data, error } = await client
      .from('sponsorship_applications')
      .select(
        `
        id,
        sponsorship_id,
        status,
        response_text,
        applied_at,
        deliverable_url,
        deliverable_submitted_at,
        deliverable_approved_at,
        sponsorship:sponsorships (
          id,
          title,
          payment_amount_mnt,
          status,
          deadline_complete
        )
      `
      )
      .eq('creator_user_id', userId)
      .order('applied_at', { ascending: false });

    if (error) {
      throw new Error(`Failed to load applications: ${error.message}`);
    }

    return (data ?? []).map((row) => {
      const sponsorship = Array.isArray(row.sponsorship)
        ? row.sponsorship[0]
        : row.sponsorship;

      return {
        id: row.id,
        sponsorship_id: row.sponsorship_id,
        status: row.status,
        response_text: row.response_text,
        applied_at: row.applied_at,
        deliverable_url: row.deliverable_url,
        deliverable_submitted_at: row.deliverable_submitted_at,
        deliverable_approved_at: row.deliverable_approved_at,
        sponsorship: sponsorship
          ? {
              id: sponsorship.id,
              title: sponsorship.title,
              payment_amount_mnt: toNumber(sponsorship.payment_amount_mnt),
              status: sponsorship.status,
              deadline_complete: sponsorship.deadline_complete,
            }
          : null,
      };
    });
  }

  public async submitDeliverable(
    applicationId: string,
    userId: string,
    accessToken: string,
    deliverableUrl: string
  ): Promise<{ id: string; deliverable_url: string | null; deliverable_submitted_at: string | null }> {
    if (!deliverableUrl?.trim()) {
      throw new Error('A deliverable link is required');
    }
    const normalizedUrl = normalizeDeliverableUrl(deliverableUrl);
    if (!normalizedUrl) {
      throw new Error('Deliverable must be an https link to a TikTok, YouTube, or Instagram post');
    }

    const client = getAuthenticatedClient(accessToken);

    const { data: application, error: findError } = await client
      .from('sponsorship_applications')
      .select('id, creator_user_id, status, sponsorship_id, deliverable_approved_at')
      .eq('id', applicationId)
      .eq('creator_user_id', userId)
      .single();

    if (findError || !application) {
      throw new Error('Application not found');
    }

    if (application.status !== 'approved') {
      throw new Error('Only approved applications can submit a deliverable');
    }
    if (application.deliverable_approved_at) {
      throw new Error('This deliverable was already approved and cannot be changed');
    }

    const { data, error } = await client
      .from('sponsorship_applications')
      .update({
        deliverable_url: normalizedUrl,
        deliverable_submitted_at: new Date().toISOString(),
      })
      .eq('id', applicationId)
      .select('id, deliverable_url, deliverable_submitted_at')
      .single();

    if (error) {
      throw new Error(`Failed to submit deliverable: ${error.message}`);
    }

    if (supabaseAdmin) {
      const { data: sponsorship } = await supabaseAdmin
        .from('sponsorships')
        .select('sponsor_user_id, title')
        .eq('id', application.sponsorship_id)
        .single();
      if (sponsorship) {
        await notificationService.notifyDeliverableSubmitted(
          sponsorship.sponsor_user_id,
          sponsorship.title ?? 'Campaign'
        );
      }
    }

    return data;
  }
}

export default new SponsorshipService();
