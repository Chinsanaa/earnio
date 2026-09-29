'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { CreatorPageHeader } from '@/components/creator/CreatorPageHeader';
import { DashboardShell } from '@/components/dashboard/DashboardShell';
import { SponsorshipCard } from '@/components/sponsorships/SponsorshipCard';
import { buttonVariants, Button } from '@/components/ui/button';
import { EmptyState } from '@/components/ui/empty-state';
import { Skeleton } from '@/components/ui/Skeleton';
import { SearchX, Sparkles } from 'lucide-react';
import { contentTypeLabel } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import { ApiError } from '@/lib/api/client';
import { listSponsorships } from '@/lib/api/sponsorships';
import type { SponsorshipListing } from '@/lib/types/sponsorship';

const PAGE_SIZE = 24;

export default function SponsorshipsPage() {
  const [listings, setListings] = useState<SponsorshipListing[]>([]);
  const [hasMore, setHasMore] = useState(false);
  const [nextOffset, setNextOffset] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [query, setQuery] = useState('');
  const [format, setFormat] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { t } = useLanguage();

  useEffect(() => {
    listSponsorships({ limit: PAGE_SIZE })
      .then((page) => {
        setListings(page.items);
        setHasMore(page.hasMore);
        setNextOffset(page.nextOffset);
      })
      .catch((err) =>
        setError(err instanceof ApiError ? err.message : 'Failed to load sponsorships')
      )
      .finally(() => setLoading(false));
  }, []);

  async function loadMore() {
    setLoadingMore(true);
    try {
      const page = await listSponsorships({ limit: PAGE_SIZE, offset: nextOffset });
      setListings((prev) => [...prev, ...page.items]);
      setHasMore(page.hasMore);
      setNextOffset(page.nextOffset);
    } catch {
      // Keep loaded listings; the user can retry.
    } finally {
      setLoadingMore(false);
    }
  }

  const formats = useMemo(
    () => Array.from(new Set(listings.map((s) => s.content_type).filter((c): c is string => !!c))),
    [listings]
  );

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return listings.filter(
      (s) =>
        (!format || s.content_type === format) &&
        (!q ||
          s.title.toLowerCase().includes(q) ||
          s.description.toLowerCase().includes(q) ||
          (s.sponsor?.name?.toLowerCase().includes(q) ?? false))
    );
  }, [listings, query, format]);

  const isFiltering = !!query || !!format;

  return (
    <DashboardShell>
      <div className="mx-auto max-w-6xl">
        <CreatorPageHeader
          title={t('explore')}
          subtitle={t('sponsorships_subtitle')}
          action={
            <Link href="/sponsorships/applications" className={buttonVariants({ variant: 'outline' })}>
              {t('my_applications')}
            </Link>
          }
        />

        <div className="creator-panel mb-8">
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-landing-muted"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={2}
            >
              <path strokeLinecap="round" d="M21 21l-4.35-4.35M11 18a7 7 0 100-14 7 7 0 000 14z" />
            </svg>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t('search_sponsorships')}
              className="creator-search"
              aria-label={t('search_sponsorships')}
            />
          </div>
          {formats.length > 1 ? (
            <div className="mt-4 flex flex-wrap gap-2" role="group" aria-label={t('filter_by_format')}>
              {[null, ...formats].map((f) => {
                const active = format === f;
                return (
                  <button
                    key={f ?? 'all'}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setFormat(f)}
                    className={`rounded-full border-2 px-3.5 py-1.5 text-sm font-bold capitalize transition-colors ${
                      active
                        ? 'border-outline bg-tint-blue text-tint-foreground shadow-hard-sm'
                        : 'border-border-strong bg-card text-foreground hover:border-outline'
                    }`}
                  >
                    {f ? contentTypeLabel(f) : t('all')}
                  </button>
                );
              })}
            </div>
          ) : null}
          {!loading && !error ? (
            <p className="mt-3 text-sm text-landing-muted" aria-live="polite">
              {filtered.length} {filtered.length === 1 ? t('opportunity_available') : t('opportunities_available')}
            </p>
          ) : null}
        </div>

        {loading && (
          <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3" aria-label={t('loading_opportunities')}>
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 rounded-2xl" />
            ))}
          </div>
        )}
        {error && (
          <p className="alert-error">{error}</p>
        )}

        {!loading && !error && filtered.length === 0 && (
          <EmptyState
            icon={isFiltering ? SearchX : Sparkles}
            title={isFiltering ? t('no_sponsorships_match') : t('no_active_sponsorships')}
            action={
              isFiltering ? (
                <Button
                  variant="outline"
                  onClick={() => {
                    setQuery('');
                    setFormat(null);
                  }}
                >
                  {t('all')}
                </Button>
              ) : null
            }
          />
        )}

        {filtered.length > 0 && (
          <>
            <h2 className="mb-4 text-sm font-bold uppercase tracking-wider text-landing-muted">
              {isFiltering ? t('results') : t('for_you')}
            </h2>
            <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3">
              {filtered.map((s) => (
                <SponsorshipCard key={s.id} sponsorship={s} />
              ))}
            </div>
            {hasMore && !isFiltering && (
              <div className="mt-6 flex justify-center">
                <Button variant="outline" onClick={loadMore} disabled={loadingMore}>
                  {loadingMore ? t('loading') : t('load_more')}
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </DashboardShell>
  );
}
