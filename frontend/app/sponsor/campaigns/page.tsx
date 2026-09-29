'use client';

import { useEffect, useMemo, useState } from 'react';
import { Megaphone, Plus } from 'lucide-react';
import { buttonVariants } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/Skeleton';
import Link from 'next/link';
import { SponsorShell } from '@/components/sponsor/SponsorShell';
import { CampaignStatusBadge } from '@/components/sponsor/CampaignStatusBadge';
import { PageHeader } from '@/components/ui/PageHeader';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { listSponsorCampaigns } from '@/lib/api/sponsor';
import { contentTypeLabel, formatDate, formatMnt } from '@/lib/format';
import { isLegacyUnpublished } from '@/lib/sponsor/campaignForm';
import type { SponsorCampaign } from '@/lib/types/sponsor';

type FilterTab = 'all' | 'published' | 'closed';

function matchesTab(c: SponsorCampaign, tab: FilterTab): boolean {
  if (tab === 'all') return true;
  if (tab === 'published') return c.status === 'active';
  return c.status === 'closed';
}

export default function SponsorCampaignsPage() {
  const [campaigns, setCampaigns] = useState<SponsorCampaign[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<FilterTab>('all');
  const { t } = useLanguage();

  useEffect(() => {
    listSponsorCampaigns()
      .then(setCampaigns)
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load campaigns')
      )
      .finally(() => setLoading(false));
  }, []);

  const filtered = useMemo(() => {
    return campaigns.filter((c) => matchesTab(c, tab));
  }, [campaigns, tab]);

  const counts = useMemo(
    () => ({
      all: campaigns.length,
      published: campaigns.filter((c) => c.status === 'active').length,
      closed: campaigns.filter((c) => c.status === 'closed').length,
      legacy: campaigns.filter((c) => isLegacyUnpublished(c.status)).length,
    }),
    [campaigns]
  );

  const tabLabels: Record<FilterTab, string> = {
    all: t('all'),
    published: t('published'),
    closed: t('closed'),
  };

  return (
    <SponsorShell>
      <PageHeader
        eyebrow="Sponsor"
        title={t('campaigns')}
        description={t('campaigns_subtitle')}
        actions={
          <Link href="/sponsor/campaigns/new" className={buttonVariants({ variant: 'pop' })}>
            <Plus className="size-4" aria-hidden />
            {t('new_campaign')}
          </Link>
        }
      />

      {counts.legacy > 0 && (
        <p className="alert-warning mb-4">
          {counts.legacy} older campaign{counts.legacy === 1 ? '' : 's'} need publishing — open
          them and use Publish.
        </p>
      )}

      <div className="mb-6 flex flex-wrap gap-2" role="group">
        {(['all', 'published', 'closed'] as const).map((key) => (
          <button
            key={key}
            type="button"
            aria-pressed={tab === key}
            onClick={() => setTab(key)}
            className={`min-h-10 rounded-full border-2 px-4 py-1.5 text-sm font-bold transition-colors ${
              tab === key
                ? 'border-outline bg-tint-blue text-tint-foreground shadow-hard-sm'
                : 'border-border-strong bg-card text-foreground hover:border-outline'
            }`}
          >
            {tabLabels[key]} ({counts[key]})
          </button>
        ))}
      </div>

      {loading && (
        <div className="space-y-4" aria-label={t('loading_campaigns')}>
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
      )}
      {error ? (
        <p className="alert-error">{error}</p>
      ) : null}

      {!loading && !error && filtered.length === 0 && (
        <EmptyState
          icon={Megaphone}
          title={tab === 'all' ? t('no_campaigns_yet') : `No ${tabLabels[tab].toLowerCase()} campaigns.`}
          action={
            tab === 'all' ? (
              <Link href="/sponsor/campaigns/new" className={buttonVariants({ variant: 'pop' })}>
                <Plus className="size-4" aria-hidden />
                {t('new_campaign')}
              </Link>
            ) : null
          }
        />
      )}

      <div className="space-y-4">
        {filtered.map((c) => (
          <Link
            key={c.id}
            href={`/sponsor/campaigns/${c.id}`}
            className="creator-panel pop-press block cursor-pointer p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-lg font-bold text-[color:var(--foreground)]">
                    {c.title}
                  </h2>
                  <CampaignStatusBadge status={c.status} />
                </div>
                <p className="mt-1 line-clamp-2 text-sm text-[color:var(--muted-foreground)]">
                  {c.description}
                </p>
                <p className="mt-2 text-xs text-[color:var(--muted)]">
                  {contentTypeLabel(c.content_type)} · {t('apply_by').replace('{date}', formatDate(c.deadline_apply))}
                </p>
                {isLegacyUnpublished(c.status) && (
                  <p className="mt-2 text-xs font-semibold text-[color:var(--primary)]">
                    {t('publish_to_go_live')}
                  </p>
                )}
              </div>
              <div className="text-right">
                <p className="font-mono text-lg font-bold text-[color:var(--foreground)]">
                  {formatMnt(c.payment_amount_mnt)}
                </p>
                <p className="mt-1 text-xs text-[color:var(--muted)]">
                  {c.applicationCount} {t('applications')}
                  {c.pendingCount > 0 && (
                    <span className="badge-status-pending ml-2">
                      {c.pendingCount} {t('pending_applications').toLowerCase()}
                    </span>
                  )}
                </p>
              </div>
            </div>
          </Link>
        ))}
      </div>
    </SponsorShell>
  );
}
