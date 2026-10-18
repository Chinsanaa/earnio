export interface ApplicationStatusBreakdown {
  pending: number;
  approved: number;
  rejected: number;
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

export interface CampaignPaymentStatus {
  approvedCount: number;
  submittedCount: number;
  deliverablesApprovedCount: number;
  amountDueMnt: number;
  deadlinePassed: boolean;
  allSubmitted: boolean;
  readyToPay: boolean;
  paidAt: string | null;
}

export interface SponsorProfile {
  companyName: string | null;
  websiteUrl: string | null;
  logoUrl: string | null;
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
  deliverable_approved_at: string | null;
  creator: {
    id: string;
    name: string;
    username: string;
    email: string;
  } | null;
}

export interface SponsorCampaignDetail {
  campaign: SponsorCampaign;
  applications: SponsorApplication[];
  statusBreakdown: ApplicationStatusBreakdown;
  approvalRate: number | null;
  payment: CampaignPaymentStatus;
}
