import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import {
  buildSponsorshipPaymentLedgerRows,
  buildStatusBreakdown,
  computeApprovalRate,
  computePaymentStatus,
  validateCampaignPayload,
  type SponsorCampaign,
  type SponsorApplication,
  type CampaignPayload,
} from '../services/sponsorService';
import { PLATFORM_FEE_RATE, computeBalances } from '../services/walletService';

function makeCampaign(overrides: Partial<SponsorCampaign> = {}): SponsorCampaign {
  return {
    id: 'c1',
    title: 'Campaign',
    description: 'Desc',
    payment_amount_mnt: 100_000,
    content_type: null,
    required_followers_min: null,
    required_followers_max: null,
    engagement_rate_min: null,
    status: 'active',
    deadline_apply: null,
    deadline_complete: null,
    created_at: null,
    applicationCount: 0,
    pendingCount: 0,
    paymentMarkedPaidAt: null,
    ...overrides,
  };
}

function makeApplication(overrides: Partial<SponsorApplication> = {}): SponsorApplication {
  return {
    id: 'a1',
    sponsorship_id: 'c1',
    status: 'pending',
    response_text: null,
    sponsor_notes: null,
    applied_at: null,
    deliverable_url: null,
    deliverable_submitted_at: null,
    deliverable_approved_at: null,
    creator: null,
    ...overrides,
  };
}

const PAST = '2000-01-01T00:00:00.000Z';
const FUTURE = '2999-01-01T00:00:00.000Z';

describe('buildStatusBreakdown', () => {
  it('counts applications by status', () => {
    const breakdown = buildStatusBreakdown([
      { status: 'pending' },
      { status: 'approved' },
      { status: 'approved' },
      { status: 'rejected' },
      { status: 'withdrawn' }, // unknown statuses are ignored
    ]);

    assert.deepEqual(breakdown, { pending: 1, approved: 2, rejected: 1 });
  });

  it('returns all zeros for no applications', () => {
    assert.deepEqual(buildStatusBreakdown([]), { pending: 0, approved: 0, rejected: 0 });
  });
});

describe('computeApprovalRate', () => {
  it('returns null when nothing has been decided', () => {
    assert.equal(computeApprovalRate({ pending: 5, approved: 0, rejected: 0 }), null);
  });

  it('divides approved by total decided (approved + rejected)', () => {
    assert.equal(computeApprovalRate({ pending: 2, approved: 3, rejected: 1 }), 0.75);
  });

  it('ignores pending applications in the denominator', () => {
    assert.equal(computeApprovalRate({ pending: 100, approved: 1, rejected: 1 }), 0.5);
  });

  it('returns 1 when every decided application was approved', () => {
    assert.equal(computeApprovalRate({ pending: 0, approved: 4, rejected: 0 }), 1);
  });
});

describe('computePaymentStatus', () => {
  it('bills payment per approved applicant', () => {
    const campaign = makeCampaign({ payment_amount_mnt: 100_000 });
    const apps = [
      makeApplication({ id: 'a1', status: 'approved' }),
      makeApplication({ id: 'a2', status: 'approved' }),
      makeApplication({ id: 'a3', status: 'pending' }),
      makeApplication({ id: 'a4', status: 'rejected' }),
    ];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.approvedCount, 2);
    assert.equal(status.amountDueMnt, 200_000);
  });

  it('marks allSubmitted only when every approved applicant has a deliverable', () => {
    const campaign = makeCampaign();
    const apps = [
      makeApplication({ id: 'a1', status: 'approved', deliverable_url: 'http://x/1' }),
      makeApplication({ id: 'a2', status: 'approved', deliverable_url: null }),
    ];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.submittedCount, 1);
    assert.equal(status.allSubmitted, false);
  });

  it('is not allSubmitted when there are no approved applicants', () => {
    const campaign = makeCampaign();
    const apps = [makeApplication({ status: 'pending' })];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.approvedCount, 0);
    assert.equal(status.allSubmitted, false);
    assert.equal(status.amountDueMnt, 0);
  });

  it('flags deadlinePassed when the completion deadline is in the past', () => {
    assert.equal(
      computePaymentStatus(makeCampaign({ deadline_complete: PAST }), []).deadlinePassed,
      true
    );
    assert.equal(
      computePaymentStatus(makeCampaign({ deadline_complete: FUTURE }), []).deadlinePassed,
      false
    );
  });

  it('is readyToPay only when unpaid and all deliverables approved', () => {
    const campaign = makeCampaign({ deadline_complete: PAST, paymentMarkedPaidAt: null });
    const apps = [
      makeApplication({
        id: 'a1',
        status: 'approved',
        deliverable_url: 'http://x/1',
        deliverable_approved_at: PAST,
      }),
    ];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.readyToPay, true);
    assert.equal(status.deliverablesApprovedCount, 1);
  });

  it('is not readyToPay while a submitted deliverable awaits approval', () => {
    const campaign = makeCampaign({ deadline_complete: PAST });
    const apps = [
      makeApplication({
        id: 'a1',
        status: 'approved',
        deliverable_url: 'http://x/1',
        deliverable_approved_at: PAST,
      }),
      makeApplication({ id: 'a2', status: 'approved', deliverable_url: 'http://x/2' }),
    ];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.allSubmitted, true);
    assert.equal(status.readyToPay, false);
  });

  it('is not readyToPay once the campaign has been marked paid', () => {
    const campaign = makeCampaign({
      deadline_complete: PAST,
      paymentMarkedPaidAt: '2020-05-01T00:00:00.000Z',
    });
    const apps = [
      makeApplication({ id: 'a1', status: 'approved', deliverable_url: 'http://x/1' }),
    ];

    const status = computePaymentStatus(campaign, apps);

    assert.equal(status.readyToPay, false);
    assert.equal(status.paidAt, '2020-05-01T00:00:00.000Z');
  });

  it('does not wait for the completion deadline once deliverables are approved', () => {
    const campaign = makeCampaign({ deadline_complete: FUTURE });
    const apps = [
      makeApplication({
        id: 'a1',
        status: 'approved',
        deliverable_url: 'http://x/1',
        deliverable_approved_at: PAST,
      }),
    ];

    assert.equal(computePaymentStatus(campaign, apps).readyToPay, true);
  });
});

describe('validateCampaignPayload', () => {
  const base: CampaignPayload = {
    title: 'Launch',
    description: 'Promote our product',
    paymentAmountMnt: 50_000,
  };

  it('accepts a valid payload', () => {
    assert.doesNotThrow(() => validateCampaignPayload(base));
  });

  it('rejects a missing/blank title', () => {
    assert.throws(() => validateCampaignPayload({ ...base, title: '   ' }), /required/);
  });

  it('rejects a missing/blank description', () => {
    assert.throws(() => validateCampaignPayload({ ...base, description: '' }), /required/);
  });

  it('rejects payment below the 10,000 MNT minimum', () => {
    assert.throws(
      () => validateCampaignPayload({ ...base, paymentAmountMnt: 9_999 }),
      /Minimum payment/
    );
  });

  it('rejects a zero/absent payment amount', () => {
    assert.throws(
      () => validateCampaignPayload({ ...base, paymentAmountMnt: 0 }),
      /Minimum payment/
    );
  });
});

describe('buildSponsorshipPaymentLedgerRows', () => {
  it('creates gross credit + 20% fee rows that net to 80% available', () => {
    const gross = 500_000;
    const rows = buildSponsorshipPaymentLedgerRows({
      creatorUserId: 'creator-1',
      campaignId: 'camp-1',
      campaignTitle: 'Skincare UGC',
      paymentAmountMnt: gross,
    });

    assert.equal(rows.length, 2);
    assert.equal(rows[0].type, 'sponsorship_credit');
    assert.equal(rows[0].amount_mnt, gross);
    assert.equal(rows[0].user_id, 'creator-1');
    assert.equal(rows[0].reference_id, 'camp-1');
    assert.equal(rows[1].type, 'platform_fee');
    assert.equal(rows[1].amount_mnt, Math.round(gross * PLATFORM_FEE_RATE));

    const balances = computeBalances(
      rows.map((r) => ({ type: r.type, amount_mnt: r.amount_mnt, status: r.status }))
    );
    assert.equal(balances.available, Math.round(gross * (1 - PLATFORM_FEE_RATE)));
    assert.equal(balances.totalFees, Math.round(gross * PLATFORM_FEE_RATE));
  });

  it('rejects non-positive payment amounts', () => {
    assert.throws(
      () =>
        buildSponsorshipPaymentLedgerRows({
          creatorUserId: 'c1',
          campaignId: 'camp-1',
          campaignTitle: 'X',
          paymentAmountMnt: 0,
        }),
      /positive/
    );
  });
});
