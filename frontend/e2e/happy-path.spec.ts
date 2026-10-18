import { test, expect, type APIRequestContext } from '@playwright/test';

const API_URL = process.env.PLAYWRIGHT_API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';
const PASSWORD = 'TestPass1!';

type AuthResult = {
  accessToken: string;
  user: { id: string; email: string; userType: string };
};

async function apiReady(request: APIRequestContext): Promise<boolean> {
  try {
    const res = await request.get(`${API_URL}/api/health`, { timeout: 5_000 });
    return res.ok();
  } catch {
    return false;
  }
}

async function signup(
  request: APIRequestContext,
  payload: {
    email: string;
    name: string;
    username: string;
    userType: 'creator' | 'sponsor';
  }
): Promise<AuthResult> {
  const res = await request.post(`${API_URL}/api/auth/signup`, {
    data: {
      email: payload.email,
      password: PASSWORD,
      name: payload.name,
      username: payload.username,
      userType: payload.userType,
      acceptedTerms: true,
    },
  });
  const body = await res.json();
  if (!res.ok()) {
    throw new Error(`Signup failed (${res.status()}): ${JSON.stringify(body)}`);
  }
  return { accessToken: body.accessToken, user: body.user };
}

function authHeaders(token: string) {
  return {
    Authorization: `Bearer ${token}`,
    'Content-Type': 'application/json',
  };
}

test.describe('sponsorship happy path', () => {
  test('signup → apply → approve → deliverable → approve deliverable → pay → wallet credit → payout', async ({
    request,
    page,
    context,
  }) => {
    test.skip(!(await apiReady(request)), `API not reachable at ${API_URL}`);

    const stamp = Date.now().toString(36);
    const creatorEmail = `creator_${stamp}@example.com`;
    const sponsorEmail = `sponsor_${stamp}@example.com`;
    const creatorUsername = `c_${stamp}`.slice(0, 24);
    const sponsorUsername = `s_${stamp}`.slice(0, 24);

    const creator = await signup(request, {
      email: creatorEmail,
      name: 'E2E Creator',
      username: creatorUsername,
      userType: 'creator',
    });
    const sponsor = await signup(request, {
      email: sponsorEmail,
      name: 'E2E Sponsor',
      username: sponsorUsername,
      userType: 'sponsor',
    });

    const gross = 100_000;
    const createRes = await request.post(`${API_URL}/api/sponsor/campaigns`, {
      headers: authHeaders(sponsor.accessToken),
      data: {
        title: `E2E Campaign ${stamp}`,
        description: 'Portfolio demo campaign for Playwright E2E.',
        paymentAmountMnt: gross,
        contentType: 'video',
      },
    });
    const createBody = await createRes.json();
    expect(createRes.ok(), JSON.stringify(createBody)).toBeTruthy();
    const campaignId = createBody.campaign.id as string;

    // New campaigns go live immediately; only legacy drafts need publishing.
    if (createBody.campaign.status === 'draft') {
      const publishRes = await request.patch(
        `${API_URL}/api/sponsor/campaigns/${campaignId}/status`,
        {
          headers: authHeaders(sponsor.accessToken),
          data: { status: 'active' },
        }
      );
      expect(publishRes.ok()).toBeTruthy();
    }

    const applyRes = await request.post(`${API_URL}/api/sponsorships/${campaignId}/apply`, {
      headers: authHeaders(creator.accessToken),
      data: { responseText: 'I would love to create this video for your brand.' },
    });
    const applyBody = await applyRes.json();
    expect(applyRes.ok(), JSON.stringify(applyBody)).toBeTruthy();
    const applicationId = applyBody.application.id as string;

    const approveRes = await request.patch(
      `${API_URL}/api/sponsor/applications/${applicationId}`,
      {
        headers: authHeaders(sponsor.accessToken),
        data: { status: 'approved', sponsorNotes: 'Looking forward to it' },
      }
    );
    expect(approveRes.ok()).toBeTruthy();

    const deliverableRes = await request.patch(
      `${API_URL}/api/sponsorships/applications/${applicationId}/deliverable`,
      {
        headers: authHeaders(creator.accessToken),
        data: { deliverableUrl: 'https://www.tiktok.com/@demo/video/1234567890' },
      }
    );
    expect(deliverableRes.ok()).toBeTruthy();

    const earlyPayRes = await request.post(`${API_URL}/api/sponsor/campaigns/${campaignId}/payment`, {
      headers: authHeaders(sponsor.accessToken),
    });
    expect(earlyPayRes.status(), 'payment must wait for deliverable approval').toBe(400);

    const approveDeliverableRes = await request.post(
      `${API_URL}/api/sponsor/applications/${applicationId}/deliverable-approval`,
      { headers: authHeaders(sponsor.accessToken) }
    );
    expect(approveDeliverableRes.ok()).toBeTruthy();

    const payRes = await request.post(`${API_URL}/api/sponsor/campaigns/${campaignId}/payment`, {
      headers: authHeaders(sponsor.accessToken),
    });
    const payBody = await payRes.json();
    expect(payRes.ok(), JSON.stringify(payBody)).toBeTruthy();

    const summaryRes = await request.get(`${API_URL}/api/wallet/summary`, {
      headers: authHeaders(creator.accessToken),
    });
    const summary = await summaryRes.json();
    expect(summaryRes.ok()).toBeTruthy();
    expect(summary.availableBalanceMnt).toBe(80_000);

    const bankRes = await request.post(`${API_URL}/api/wallet/bank-accounts`, {
      headers: authHeaders(creator.accessToken),
      data: {
        bankName: 'Khan Bank',
        accountNumber: '5001234567',
        accountHolderName: 'E2E Creator',
        setAsDefault: true,
      },
    });
    const bankBody = await bankRes.json();
    expect(bankRes.ok(), JSON.stringify(bankBody)).toBeTruthy();
    const bankAccountId = bankBody.bankAccount.id as string;

    const payoutRes = await request.post(`${API_URL}/api/wallet/payouts`, {
      headers: authHeaders(creator.accessToken),
      data: { amountMnt: 50_000, bankAccountId },
    });
    const payoutBody = await payoutRes.json();
    expect(payoutRes.ok(), JSON.stringify(payoutBody)).toBeTruthy();

    // UI: creator can log in and see wallet credit / pending payout
    await context.clearCookies();
    await page.goto('/login/creator');
    await page.locator('#email').fill(creatorEmail);
    await page.locator('#password').fill(PASSWORD);
    await page.getByRole('button', { name: /log in|sign in|нэвтрэх/i }).click();
    await expect(page).toHaveURL(/\/dashboard/, { timeout: 30_000 });

    // Dismiss optional verify modal if present
    const continueBtn = page.getByRole('button', { name: /continue without verifying|баталгаажуулалгүйгээр/i });
    if (await continueBtn.isVisible().catch(() => false)) {
      await continueBtn.click();
    }

    await page.goto('/wallet');
    await expect(page.getByText(/50,?000|₮/).first()).toBeVisible({ timeout: 20_000 });
  });
});
