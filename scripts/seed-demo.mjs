#!/usr/bin/env node
/**
 * Seeds a realistic demo state for the portfolio walkthrough by driving the
 * real API: sponsor signup -> campaign -> creator signup -> apply -> approve
 * -> deliverable -> approve deliverable -> mark paid -> bank account -> payout request.
 *
 * Usage: npm run dev (in another shell), then `node scripts/seed-demo.mjs`
 */

const BACKEND = process.env.BACKEND_URL || 'http://localhost:3001';
const PASSWORD = 'DemoPass1!';
const STAMP = Date.now().toString(36);

const SPONSOR = {
  email: `maybee.demo@earnio.local`,
  name: 'Maybee Pop&Joy',
  username: `maybee_demo`,
  userType: 'sponsor',
};

const CREATOR = {
  email: `demo.creator@earnio.local`,
  name: 'Demo Creator',
  username: `demo_creator`,
  userType: 'creator',
};

const CAMPAIGN = {
  title: 'Maybee Pop&Joy Launch Video',
  description:
    'Film a 30-60s unboxing/taste-test video featuring the new Pop&Joy snack line for TikTok/Instagram Reels.',
  paymentAmountMnt: 250_000,
  contentType: 'video',
};

async function json(res) {
  const body = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(`${res.status} ${res.url}: ${JSON.stringify(body)}`);
  }
  return body;
}

function authHeaders(token) {
  return { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' };
}

async function login(email, password) {
  const res = await fetch(`${BACKEND}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  if (res.ok) return json(res);
  return null;
}

async function signup(payload) {
  const res = await fetch(`${BACKEND}/api/auth/signup`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...payload, password: PASSWORD, acceptedTerms: true }),
  });
  if (res.status === 409 || res.status === 400) {
    console.log(`  already exists, logging in: ${payload.email}`);
    const existing = await login(payload.email, PASSWORD);
    if (existing) return existing;
  }
  return json(res);
}

async function ensureAccount(payload) {
  console.log(`Ensuring ${payload.userType} account: ${payload.email}`);
  return signup(payload);
}

async function main() {
  const health = await fetch(`${BACKEND}/api/health`).catch(() => null);
  if (!health || !health.ok) {
    console.error(`Backend not reachable at ${BACKEND}. Start it with \`npm run dev\` first.`);
    process.exit(1);
  }

  const sponsor = await ensureAccount(SPONSOR);
  const creator = await ensureAccount(CREATOR);

  console.log('Creating campaign...');
  const createRes = await fetch(`${BACKEND}/api/sponsor/campaigns`, {
    method: 'POST',
    headers: authHeaders(sponsor.accessToken),
    body: JSON.stringify(CAMPAIGN),
  });
  const { campaign } = await json(createRes);
  console.log(`  campaign id: ${campaign.id}`);

  if (campaign.status === 'draft') {
    console.log('Publishing campaign (status: active)...');
    await json(
      await fetch(`${BACKEND}/api/sponsor/campaigns/${campaign.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(sponsor.accessToken),
        body: JSON.stringify({ status: 'active' }),
      })
    );
  }

  console.log('Creator applying...');
  const applyRes = await fetch(`${BACKEND}/api/sponsorships/${campaign.id}/apply`, {
    method: 'POST',
    headers: authHeaders(creator.accessToken),
    body: JSON.stringify({
      responseText: "I'd love to create this launch video — I've done snack unboxings before and can turn it around in 3 days.",
    }),
  });
  const { application } = await json(applyRes);
  console.log(`  application id: ${application.id}`);

  console.log('Sponsor approving application...');
  await json(
    await fetch(`${BACKEND}/api/sponsor/applications/${application.id}`, {
      method: 'PATCH',
      headers: authHeaders(sponsor.accessToken),
      body: JSON.stringify({ status: 'approved', sponsorNotes: 'Great pitch, excited to see it!' }),
    })
  );

  console.log('Creator submitting deliverable...');
  await json(
    await fetch(`${BACKEND}/api/sponsorships/applications/${application.id}/deliverable`, {
      method: 'PATCH',
      headers: authHeaders(creator.accessToken),
      body: JSON.stringify({ deliverableUrl: `https://www.tiktok.com/@demo_creator/video/${STAMP}` }),
    })
  );

  console.log('Sponsor approving deliverable...');
  await json(
    await fetch(`${BACKEND}/api/sponsor/applications/${application.id}/deliverable-approval`, {
      method: 'POST',
      headers: authHeaders(sponsor.accessToken),
    })
  );

  console.log('Sponsor marking campaign paid...');
  await json(
    await fetch(`${BACKEND}/api/sponsor/campaigns/${campaign.id}/payment`, {
      method: 'POST',
      headers: authHeaders(sponsor.accessToken),
    })
  );

  console.log('Adding a bank account for the creator...');
  const bankRes = await fetch(`${BACKEND}/api/wallet/bank-accounts`, {
    method: 'POST',
    headers: authHeaders(creator.accessToken),
    body: JSON.stringify({
      bankName: 'Khan Bank',
      accountNumber: '5001234567',
      accountHolderName: CREATOR.name,
      setAsDefault: true,
    }),
  });
  const bankBody = await bankRes.json().catch(() => ({}));
  let bankAccountId = bankBody.bankAccount?.id;
  if (!bankRes.ok) {
    console.log('  bank account already exists, fetching existing one...');
    const listRes = await json(
      await fetch(`${BACKEND}/api/wallet/bank-accounts`, { headers: authHeaders(creator.accessToken) })
    );
    bankAccountId = listRes.bankAccounts?.[0]?.id;
  }

  console.log('Requesting a payout...');
  const payoutRes = await fetch(`${BACKEND}/api/wallet/payouts`, {
    method: 'POST',
    headers: authHeaders(creator.accessToken),
    body: JSON.stringify({ amountMnt: 50_000, bankAccountId }),
  });
  const payoutBody = await payoutRes.json().catch(() => ({}));
  if (!payoutRes.ok) {
    console.log(`  payout skipped: ${JSON.stringify(payoutBody)}`);
  }

  console.log('\nDemo seeded:');
  console.log(`  Sponsor login:  ${SPONSOR.email} / ${PASSWORD}`);
  console.log(`  Creator login:  ${CREATOR.email} / ${PASSWORD}`);
  console.log(`  Visit http://localhost:3000/login/creator or /login/sponsor`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
