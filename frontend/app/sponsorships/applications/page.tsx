'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { CreatorPageHeader } from '@/components/creator/CreatorPageHeader';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/Skeleton';
import { Send } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { listMyApplications, submitDeliverable } from '@/lib/api/sponsorships';
import { applicationStatusLabel, formatDate, formatMnt } from '@/lib/format';
import type { SponsorshipApplication } from '@/lib/types/sponsorship';

const STATUS_STYLES: Record<string, string> = {
  pending: 'badge-status-pending',
  approved: 'badge-status-success',
  rejected: 'badge-status-neutral',
  completed: 'badge-status-info',
  paid: 'badge-status-success',
};

export default function MyApplicationsPage() {
  const [applications, setApplications] = useState<SponsorshipApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [deliverableDrafts, setDeliverableDrafts] = useState<Record<string, string>>({});
  const [submittingId, setSubmittingId] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    listMyApplications()
      .then(setApplications)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load applications')
      )
      .finally(() => setLoading(false));
  }, []);

  async function handleSubmitDeliverable(applicationId: string) {
    const url = deliverableDrafts[applicationId]?.trim();
    if (!url) return;
    setSubmittingId(applicationId);
    try {
      const deliverableUrl = await submitDeliverable(applicationId, url);
      setApplications((prev) =>
        prev.map((a) =>
          a.id === applicationId
            ? { ...a, deliverable_url: deliverableUrl, deliverable_submitted_at: new Date().toISOString() }
            : a
        )
      );
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Failed to submit deliverable');
    } finally {
      setSubmittingId(null);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-3xl">
        <CreatorPageHeader
          title={t('my_applications')}
          subtitle={t('track_sponsorships')}
          action={
            <Link href="/sponsorships" className={buttonVariants({ variant: 'outline' })}>
              ← {t('explore')}
            </Link>
          }
        />

        {loading && (
          <div className="space-y-4" aria-label={t('loading')}>
            <Skeleton className="h-36 rounded-2xl" />
            <Skeleton className="h-36 rounded-2xl" />
          </div>
        )}
        {error && (
          <p className="alert-error">{error}</p>
        )}

        {!loading && !error && applications.length === 0 && (
          <EmptyState
            icon={Send}
            title={t('no_applications_yet')}
            action={
              <Link href="/sponsorships" className={buttonVariants({ variant: 'pop' })}>
                {t('browse_opportunities')}
              </Link>
            }
          />
        )}

        <ul className="space-y-4">
          {applications.map((app) => (
            <li key={app.id} className="creator-panel-lg">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <h2 className="font-display text-lg font-bold tracking-tight text-landing-fg">
                    {app.sponsorship?.title.replace(/^\[Demo\]\s*/, '') ?? 'Sponsorship'}
                  </h2>
                  <p className="mt-1 text-sm text-landing-muted">
                    {t('applied')} {formatDate(app.applied_at)}
                  </p>
                </div>
                <span className={STATUS_STYLES[app.status] ?? STATUS_STYLES.pending}>
                  {applicationStatusLabel(app.status)}
                </span>
              </div>
              {app.sponsorship && (
                <p className="mt-3 font-mono text-xl font-bold text-landing-fg">
                  {formatMnt(app.sponsorship.payment_amount_mnt)}
                </p>
              )}
              {app.response_text && (
                <p className="mt-3 line-clamp-3 text-sm text-landing-muted">{app.response_text}</p>
              )}
              {app.status === 'approved' && (
                <div className="mt-4 rounded-xl border border-[color:var(--border)] p-4">
                  {app.deliverable_url ? (
                    <p className="text-sm text-landing-muted">
                      {t('deliverable_submitted')}{' '}
                      <a
                        href={app.deliverable_url}
                        target="_blank"
                        rel="noreferrer"
                        className="auth-link font-medium"
                      >
                        {app.deliverable_url}
                      </a>
                    </p>
                  ) : (
                    <div className="space-y-2">
                      <label className="block text-sm font-semibold text-landing-fg">
                        {t('submit_deliverable_link')}
                      </label>
                      <div className="flex flex-wrap gap-2">
                        <input
                          type="url"
                          placeholder="https://..."
                          value={deliverableDrafts[app.id] ?? ''}
                          onChange={(e) =>
                            setDeliverableDrafts((prev) => ({ ...prev, [app.id]: e.target.value }))
                          }
                          className="auth-input flex-1"
                        />
                        <button
                          type="button"
                          disabled={submittingId === app.id || !deliverableDrafts[app.id]?.trim()}
                          onClick={() => handleSubmitDeliverable(app.id)}
                          className="btn-primary w-auto px-5 disabled:opacity-50"
                        >
                          {submittingId === app.id ? t('please_wait') : t('submit')}
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
              {app.sponsorship && (
                <Link
                  href={`/sponsorships/${app.sponsorship_id}`}
                  className="auth-link mt-4 inline-block text-sm font-medium"
                >
                  {t('view_listing')}
                </Link>
              )}
            </li>
          ))}
        </ul>
      </div>
    </DashboardShell>
  );
}
