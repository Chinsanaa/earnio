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
  deliverable_approved_at?: string | null;
  sponsorship: {
    id: string;
    title: string;
    payment_amount_mnt: number;
    status: string;
    deadline_complete: string | null;
  } | null;
}
