'use client';

import { FormEvent, useEffect, useState } from 'react';
import Link from 'next/link';
import { useParams, useRouter } from 'next/navigation';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { ApiError } from '@/lib/api/client';
import { applyToSponsorship, getSponsorship } from '@/lib/api/sponsorships';
import {
  applicationStatusLabel,
  contentTypeLabel,
  formatDate,
  formatMnt,
  formatHandle,
} from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SponsorshipListing } from '@/lib/types/sponsorship';

export default function SponsorshipDetailPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const { t } = useLanguage();

  const [sponsorship, setSponsorship] = useState<SponsorshipListing | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [applyError, setApplyError] = useState<string | null>(null);

  useEffect(() => {
    getSponsorship(id)
      .then(setSponsorship)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load sponsorship')
      )
      .finally(() => setLoading(false));
  }, [id]);

  async function handleApply(e: FormEvent) {
    e.preventDefault();
    if (!message.trim()) return;
    setApplyError(null);
    setSubmitting(true);
    try {
      await applyToSponsorship(id, message.trim());
      router.push('/sponsorships/applications');
      router.refresh();
    } catch (err) {
      setApplyError(err instanceof ApiError ? err.message : 'Failed to apply');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <DashboardShell>
      <div className="mx-auto max-w-2xl">
        <Link href="/sponsorships" className="auth-link text-sm font-medium">
          {t('back_to_explore')}
        </Link>

        {loading && <p className="mt-8 text-sm text-landing-muted">{t('loading')}</p>}
        {error && (
          <p className="mt-8 alert-error">{error}</p>
        )}

        {sponsorship && (
          <article className="mt-6">
            <div className="creator-hero-card">
              <p className="text-sm font-medium text-landing-muted">
                {sponsorship.sponsor?.name ?? 'Brand partner'}
                {sponsorship.sponsor && ` · ${formatHandle(sponsorship.sponsor.username)}`}
              </p>
              <h1 className="mt-2 text-2xl font-semibold tracking-tight text-landing-fg sm:text-3xl">
                {sponsorship.title.replace(/^\[Demo\]\s*/, '')}
              </h1>
              <p className="creator-earnings-value mt-3 text-2xl sm:text-3xl">
                {formatMnt(sponsorship.payment_amount_mnt)}
              </p>
            </div>

            <dl className="creator-panel mt-6 grid gap-4 text-sm sm:grid-cols-2">
              <div>
                <dt className="text-landing-muted">{t('content_label')}</dt>
                <dd className="mt-0.5 font-medium text-landing-fg">
                  {contentTypeLabel(sponsorship.content_type)}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">{t('min_engagement_label')}</dt>
                <dd className="mt-0.5 font-medium text-landing-fg">
                  {sponsorship.engagement_rate_min != null
                    ? `${sponsorship.engagement_rate_min}%`
                    : '—'}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">{t('followers')}</dt>
                <dd className="mt-0.5 font-medium text-landing-fg">
                  {formatFollowers(
                    sponsorship.required_followers_min,
                    sponsorship.required_followers_max
                  )}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">{t('apply_by_label')}</dt>
                <dd className="mt-0.5 font-medium text-landing-fg">
                  {formatDate(sponsorship.deadline_apply)}
                </dd>
              </div>
              <div>
                <dt className="text-landing-muted">{t('complete_by_label')}</dt>
                <dd className="mt-0.5 font-medium text-landing-fg">
                  {formatDate(sponsorship.deadline_complete)}
                </dd>
              </div>
            </dl>

            <div className="creator-panel-lg mt-6">
              <h2 className="font-semibold text-landing-fg">{t('brief_label')}</h2>
              <p className="mt-3 whitespace-pre-wrap text-sm leading-relaxed text-landing-muted">
                {sponsorship.description}
              </p>
            </div>

            {sponsorship.hasApplied ? (
              <p className="creator-panel mt-6 text-sm font-medium text-landing-fg">
                {t('you_applied_status')}{' '}
                <span className="text-accent-text">
                  {applicationStatusLabel(sponsorship.applicationStatus ?? 'pending')}
                </span>
              </p>
            ) : (
              <form onSubmit={handleApply} className="creator-panel-lg mt-6 space-y-4 pb-24 md:pb-0">
                <div>
                  <label htmlFor="message" className="block text-sm font-medium text-landing-fg">
                    {t('your_pitch')}
                  </label>
                  <textarea
                    id="message"
                    required
                    rows={5}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder={t('sponsorship_pitch_placeholder')}
                    className="auth-input mt-2 min-h-[120px] resize-y"
                  />
                </div>
                {applyError && <p className="text-sm text-destructive-text">{applyError}</p>}
                <div className="fixed bottom-16 left-0 right-0 z-30 border-t-2 border-[color:var(--outline)] bg-card p-4 md:static md:border-0 md:bg-transparent md:p-0">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="landing-btn-dark w-full px-6 py-3 text-sm disabled:opacity-60 md:w-auto"
                  >
                    {submitting ? t('submitting') : t('submit_application')}
                  </button>
                </div>
              </form>
            )}
          </article>
        )}
      </div>
    </DashboardShell>
  );
}

function formatFollowers(min: number | null, max: number | null): string {
  if (min && max) return `${min.toLocaleString()} – ${max.toLocaleString()}`;
  if (min) return `${min.toLocaleString()}+`;
  if (max) return `Up to ${max.toLocaleString()}`;
  return 'Any';
}
