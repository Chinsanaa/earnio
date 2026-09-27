'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { SponsorShell } from '@/components/sponsor/SponsorShell';
import { ApplicationStatusChart } from '@/components/sponsor/ApplicationStatusChart';
import { PageHeader } from '@/components/ui/PageHeader';
import { buttonVariants } from '@/components/ui/button';
import { NumberTicker } from '@/components/ui/number-ticker';
import { Skeleton } from '@/components/ui/Skeleton';
import { ArrowRight, Inbox, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { getSponsorDashboard } from '@/lib/api/sponsor';
import { firstNameOf, formatMnt } from '@/lib/format';
import type { AuthUser } from '@/lib/types/auth';
import type { SponsorDashboardStats } from '@/lib/types/sponsor';

function SponsorDashboardBody({ user }: { user: AuthUser }) {
  const [stats, setStats] = useState<SponsorDashboardStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    let cancelled = false;

    getSponsorDashboard()
      .then((data) => {
        if (!cancelled) setStats(data);
      })
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

  return (
    <>
      <PageHeader
        title={t('greeting').replace('{name}', firstNameOf(user.name))}
        description={t('sponsor_dashboard_subtitle')}
        actions={
          <Link href="/sponsor/campaigns/new" className={buttonVariants({ variant: 'pop' })}>
            <Plus className="size-4" aria-hidden />
            {t('new_campaign')}
          </Link>
        }
      />

      {loading && (
        <div className="space-y-6" aria-label={t('loading_stats')}>
          <Skeleton className="h-56 rounded-2xl" />
          <div className="grid gap-4 lg:grid-cols-[3fr_2fr]">
            <Skeleton className="h-72 rounded-2xl" />
            <Skeleton className="h-72 rounded-2xl" />
          </div>
        </div>
      )}

      {error && (
        <p className="alert-error">
          {error}
        </p>
      )}

      {stats && !loading && (
        <>
          <div className="creator-hero">
            <div className="creator-hero-body">
              <p className="creator-hero-label">{t('active_campaign_budget')}</p>
              <NumberTicker className="creator-hero-amount block" value={stats.totalBudgetMnt} format={formatMnt} />

              <div className="creator-hero-divider" />

              <div className="creator-hero-stats">
                <div>
                  <p className="creator-hero-stat-label">{t('active_campaigns')}</p>
                  <p className="creator-hero-stat-value">{stats.activeCampaigns}</p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('total_campaigns')}</p>
                  <p className="creator-hero-stat-value">{stats.totalCampaigns}</p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('pending_applications')}</p>
                  <p className="creator-hero-stat-value">{stats.pendingApplications}</p>
                </div>
                <div>
                  <p className="creator-hero-stat-label">{t('approval_rate')}</p>
                  <p className="creator-hero-stat-value">
                    {stats.approvalRate !== null ? `${Math.round(stats.approvalRate * 100)}%` : '—'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 grid gap-4 lg:grid-cols-[3fr_2fr]">
            <div className="creator-panel-lg p-6">
              <p className="font-display text-lg font-bold text-[color:var(--foreground)]">
                {t('application_status')}
              </p>
              <div className="mt-4">
                <ApplicationStatusChart data={stats.statusBreakdown} />
              </div>
              <ApplicationStatusLegend data={stats.statusBreakdown} t={t} />
            </div>

            <div
              className={`flex flex-col justify-between rounded-3xl border-2 p-6 ${
                stats.pendingApplications > 0
                  ? 'border-pop-foreground bg-pop-lilac text-pop-foreground shadow-hard'
                  : 'border-outline bg-card text-foreground shadow-hard-sm'
              }`}
            >
              <div>
                <span className="flex size-12 items-center justify-center rounded-2xl border-2 border-current bg-[color:var(--card)] text-[color:var(--foreground)]">
                  <Inbox className="size-6" aria-hidden />
                </span>
                <p className="mt-5 font-display text-2xl font-bold leading-tight tracking-tight">
                  {stats.pendingApplications > 0
                    ? t('applications_waiting').replace('{count}', String(stats.pendingApplications))
                    : t('all_caught_up')}
                </p>
                <p className="mt-2 text-sm font-medium opacity-80">
                  {t('total_applications')}: <span className="font-mono font-bold">{stats.totalApplications}</span>
                </p>
              </div>
              {stats.pendingApplications > 0 ? (
                <Link href="/sponsor/campaigns" className={buttonVariants({ variant: 'outline', className: 'mt-6 self-start' })}>
                  {t('review_now')}
                  <ArrowRight className="size-4" aria-hidden />
                </Link>
              ) : null}
            </div>
          </div>
        </>
      )}

      <div className="mt-8">
        <Link
          href="/sponsor/campaigns"
          className="text-sm font-medium text-primary hover:text-primary"
        >
          {t('view_all_campaigns')}
        </Link>
      </div>
    </>
  );
}

export default function SponsorDashboardPage() {
  const { user, loading: authLoading } = useAuth();
  const { t } = useLanguage();
  const router = useRouter();

  useEffect(() => {
    if (!authLoading && !user) {
      router.replace('/login?next=/sponsor/dashboard');
    }
  }, [authLoading, user, router]);

  if (authLoading || !user) {
    return (
      <SponsorShell>
        <p className="text-sm text-muted-foreground">{t('loading')}</p>
      </SponsorShell>
    );
  }

  if (user.userType !== 'sponsor') {
    return (
      <SponsorShell>
        <p className="text-sm text-muted-foreground">{t('sponsor_account_required')}</p>
      </SponsorShell>
    );
  }

  return (
    <SponsorShell>
      <SponsorDashboardBody key={user.id} user={user} />
    </SponsorShell>
  );
}

function ApplicationStatusLegend({
  data,
  t,
}: {
  data: { pending: number; approved: number; rejected: number };
  t: (key: string) => string;
}) {
  const items = [
    { key: 'pending', label: t('pending_short'), value: data.pending, color: 'var(--pop-sun)' },
    { key: 'approved', label: t('approved_short'), value: data.approved, color: 'var(--pop-mint)' },
    { key: 'rejected', label: t('rejected_short'), value: data.rejected, color: 'var(--pop-coral)' },
  ];

  return (
    <div className="mt-4 flex flex-wrap gap-4">
      {items.map((item) => (
        <div key={item.key} className="flex items-center gap-2 text-sm text-[color:var(--muted-foreground)]">
          <span
            className="size-3 rounded-full border-2 border-[color:var(--outline)]"
            style={{ backgroundColor: item.color }}
          />
          {item.label}: <span className="font-semibold text-[color:var(--foreground)]">{item.value}</span>
        </div>
      ))}
    </div>
  );
}
