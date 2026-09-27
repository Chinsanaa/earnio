'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { RefreshCw, TrendingDown, TrendingUp } from 'lucide-react';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { DashboardSkeleton } from '@/components/dashboard/DashboardSkeleton';
import { MonthlyTrend } from '@/components/dashboard/MonthlyTrend';
import { PlatformBento } from '@/components/dashboard/PlatformBento';
import { GettingStartedPlan, type PlanTask } from '@/components/creator/GettingStartedPlan';
import { NumberTicker } from '@/components/ui/number-ticker';
import { RecentEarnings } from '@/components/dashboard/RecentEarnings';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { getDashboardSummary } from '@/lib/api/dashboard';
import { getWalletSummary } from '@/lib/api/wallet';
import { syncPlatform } from '@/lib/api/platforms';
import { listMyApplications } from '@/lib/api/sponsorships';
import { toast } from 'sonner';
import { firstNameOf, formatMnt, formatPercent } from '@/lib/format';
import { PageHeader } from '@/components/ui/PageHeader';
import type { AuthUser } from '@/lib/types/auth';
import type { DashboardSummary } from '@/lib/types/dashboard';
import type { WalletSummary } from '@/lib/types/wallet';

function CreatorDashboardBody({ user }: { user: AuthUser }) {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [wallet, setWallet] = useState<WalletSummary | null>(null);
  const [applicationCount, setApplicationCount] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const { t } = useLanguage();
  const router = useRouter();

  function load() {
    return Promise.all([
      getDashboardSummary(),
      getWalletSummary(),
      // The checklist is optional: never fail the dashboard because of it.
      listMyApplications().catch(() => null),
    ]).then(([summary, walletSummary, applications]) => {
      setData(summary);
      setWallet(walletSummary);
      setApplicationCount(applications ? applications.length : null);
    });
  }

  useEffect(() => {
    let cancelled = false;

    load()
      .catch((err) => {
        if (!cancelled) {
          setError(err instanceof ApiError ? err.message : 'Failed to load dashboard');
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  async function handleSyncAll() {
    if (!data || data.connectedPlatforms.length === 0) return;
    setSyncing(true);
    try {
      await Promise.all(data.connectedPlatforms.map((p) => syncPlatform(p.id)));
      await load();
      toast.success(t('sync_completed'));
    } catch {
      // Individual sync failures are retryable from the Platforms page.
      toast.error(t('sync_failed'));
    } finally {
      setSyncing(false);
    }
  }

  const mom = data?.monthOverMonthChange ?? null;
  const momPositive = mom !== null && mom >= 0;

  const tasks: PlanTask[] = data
    ? [
        {
          id: 'connect',
          label: t('step_connect_title'),
          detail: t('step_connect_desc'),
          done: data.connectedPlatforms.length > 0,
          href: '/platforms',
        },
        {
          id: 'apply',
          label: t('step_apply_title'),
          detail: t('step_apply_desc'),
          done: (applicationCount ?? 0) > 0,
          href: '/sponsorships',
        },
        {
          id: 'payout',
          label: t('step_payout_title'),
          detail: t('step_payout_desc'),
          done: !!wallet && (wallet.pendingPayoutMnt > 0 || wallet.totalPaidOutMnt > 0),
          href: '/wallet',
        },
      ]
    : [];
  const showPlan = applicationCount !== null && tasks.some((task) => !task.done);

  return (
    <>
      <PageHeader
        eyebrow={t('creator_dashboard')}
        title={t('greeting').replace('{name}', firstNameOf(user.name))}
        description={t('creator_dashboard_subtitle')}
        actions={
          data && (
            <>
              <Button
                variant="outline"
                onClick={handleSyncAll}
                disabled={syncing || data.connectedPlatforms.length === 0}
              >
                <RefreshCw className={`size-4 ${syncing ? 'animate-spin' : ''}`} />
                {syncing ? t('syncing') : t('sync')}
              </Button>
              <Button variant="pop" onClick={() => router.push('/wallet')}>
                {t('withdraw')}
              </Button>
            </>
          )
        }
      />

      {loading && <DashboardSkeleton />}

      {error && <p className="alert-error">{error}</p>}

      {data && !loading && (
        <div className="space-y-6">
          <div className="creator-hero">
            <div className="creator-hero-body">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <p className="creator-hero-label">{t('total_earnings')}</p>
                {mom !== null && (
                  <span
                    className={`creator-trend-badge ${
                      momPositive ? 'creator-trend-badge-up' : 'creator-trend-badge-down'
                    }`}
                  >
                    {momPositive ? <TrendingUp className="size-3.5" /> : <TrendingDown className="size-3.5" />}
                    {formatPercent(mom)}
                  </span>
                )}
              </div>
              <NumberTicker className="creator-hero-amount block" value={data.totalEarningsMnt} format={formatMnt} />

              <div className="creator-hero-divider" />

              <div className="creator-hero-stats">
                <div>
                  <p className="creator-hero-stat-label">{t('this_month_short')}</p>
                  <p className="creator-hero-stat-value">{formatMnt(data.earningsThisMonth)}</p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('available')}</p>
                  <p className="creator-hero-stat-value">
                    {wallet ? formatMnt(wallet.availableBalanceMnt) : '—'}
                  </p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('pending')}</p>
                  <p className="creator-hero-stat-value">
                    {wallet ? formatMnt(wallet.pendingPayoutMnt) : '—'}
                  </p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('connected')}</p>
                  <p className="creator-hero-stat-value">
                    {t('platforms_count').replace('{count}', String(data.connectedPlatforms.length))}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {showPlan ? <GettingStartedPlan title={t('getting_started_title')} tasks={tasks} /> : null}

          <PlatformBento data={data} />

          <Card className="py-4">
            <CardHeader>
              <CardTitle>{t('earnings_performance')}</CardTitle>
            </CardHeader>
            <CardContent>
              <MonthlyTrend data={data.monthlyTrend} />
            </CardContent>
          </Card>

          <RecentEarnings data={data.recentEarnings} />
        </div>
      )}
    </>
  );
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/dashboard');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <DashboardShell>
        <DashboardSkeleton />
      </DashboardShell>
    );
  }

  return (
    <DashboardShell>
      <CreatorDashboardBody key={user.id} user={user} />
    </DashboardShell>
  );
}
