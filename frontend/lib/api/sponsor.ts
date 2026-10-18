import { apiFetch } from './client';
import type {
  SponsorApplication,
  SponsorCampaign,
  SponsorCampaignDetail,
  SponsorDashboardStats,
  SponsorProfile,
} from '@/lib/types/sponsor';

export async function getSponsorDashboard(): Promise<SponsorDashboardStats> {
  return apiFetch<SponsorDashboardStats>('/api/sponsor/dashboard');
}

export async function getSponsorProfile(): Promise<SponsorProfile> {
  return apiFetch<SponsorProfile>('/api/sponsor/profile');
}

export async function updateSponsorProfile(payload: {
  companyName?: string;
  websiteUrl?: string;
  logoUrl?: string;
}): Promise<SponsorProfile> {
  return apiFetch<SponsorProfile>('/api/sponsor/profile', {
    method: 'PATCH',
    body: JSON.stringify(payload),
  });
}

export async function listSponsorCampaigns(): Promise<SponsorCampaign[]> {
  const data = await apiFetch<{ campaigns: SponsorCampaign[] }>('/api/sponsor/campaigns');
  return data.campaigns;
}

export async function createSponsorCampaign(
  payload: Record<string, unknown>
): Promise<SponsorCampaign> {
  const data = await apiFetch<{ campaign: SponsorCampaign }>('/api/sponsor/campaigns', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
  return data.campaign;
}

export async function getSponsorCampaign(id: string): Promise<SponsorCampaignDetail> {
  return apiFetch(`/api/sponsor/campaigns/${id}`);
}

export async function publishCampaign(id: string): Promise<void> {
  await apiFetch(`/api/sponsor/campaigns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'active' }),
  });
}

export async function closeCampaign(id: string): Promise<void> {
  await apiFetch(`/api/sponsor/campaigns/${id}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status: 'closed' }),
  });
}

export async function deleteSponsorCampaign(id: string): Promise<void> {
  await apiFetch(`/api/sponsor/campaigns/${id}`, { method: 'DELETE' });
}

export async function markCampaignPaid(id: string): Promise<SponsorCampaign> {
  const data = await apiFetch<{ campaign: SponsorCampaign }>(
    `/api/sponsor/campaigns/${id}/payment`,
    { method: 'POST' }
  );
  return data.campaign;
}

export async function approveDeliverable(
  id: string
): Promise<{ id: string; deliverable_approved_at: string | null }> {
  const data = await apiFetch<{ application: { id: string; deliverable_approved_at: string | null } }>(
    `/api/sponsor/applications/${id}/deliverable-approval`,
    { method: 'POST' }
  );
  return data.application;
}

export async function updateApplicationStatus(
  id: string,
  status: 'approved' | 'rejected',
  sponsorNotes?: string
): Promise<SponsorApplication> {
  const data = await apiFetch<{ application: SponsorApplication }>(
    `/api/sponsor/applications/${id}`,
    {
      method: 'PATCH',
      body: JSON.stringify({ status, sponsorNotes }),
    }
  );
  return data.application;
}
