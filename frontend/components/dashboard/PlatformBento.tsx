import Link from 'next/link';
import { Plus } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { platformTone } from '@/lib/design/platformTone';
import { formatMnt, platformLabel } from '@/lib/format';
import type { DashboardSummary } from '@/lib/types/dashboard';

const TONE_BG = {
  blue: 'bg-tint-blue',
  slate: 'bg-tint-slate',
} as const;

function compact(n: number | null): string {
  if (n === null) return '—';
  return new Intl.NumberFormat('en-US', { notation: 'compact', maximumFractionDigits: 1 }).format(n);
}

/** One solid color tile per connected platform, plus an "add platform" tile. */
export function PlatformBento({ data }: { data: DashboardSummary }) {
  const { t } = useLanguage();
  const byPlatform = new Map(data.byPlatform.map((p) => [p.platform.toLowerCase(), p]));
  const canAddMore = data.connectedPlatforms.length < 3;

  return (
    <section aria-labelledby="your-platforms">
      <h2 id="your-platforms" className="mb-3 font-display text-lg font-bold tracking-tight text-foreground">
        {t('your_platforms')}
      </h2>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {data.connectedPlatforms.map((account) => {
          const earnings = byPlatform.get(account.platform.toLowerCase());
          return (
            <Link
              key={account.id}
              href="/platforms"
              className={`pop-press flex min-h-40 flex-col justify-between rounded-2xl border-2 border-outline p-5 text-tint-foreground shadow-hard-sm ${TONE_BG[platformTone(account.platform)]}`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <p className="font-display text-lg font-bold">{platformLabel(account.platform)}</p>
                  <p className="truncate text-sm font-medium">@{account.platform_username}</p>
                </div>
                <span className="rounded-full border-2 border-outline bg-[color:var(--card)] px-2 py-0.5 font-mono text-xs font-bold text-[color:var(--foreground)]">
                  {compact(account.follower_count)}
                </span>
              </div>
              <div>
                <p className="font-mono text-xl font-bold">{earnings ? formatMnt(earnings.totalMnt) : '—'}</p>
                {earnings ? (
                  <p className="text-xs font-semibold">
                    {Math.round(earnings.share * 100)}% {t('share_of_earnings')}
                  </p>
                ) : null}
              </div>
            </Link>
          );
        })}
        {canAddMore ? (
          <Link
            href="/platforms"
            className="flex min-h-40 flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border-strong p-5 text-sm font-bold text-muted-foreground transition-colors hover:border-outline hover:text-foreground"
          >
            <span className="flex size-10 items-center justify-center rounded-full border-2 border-current">
              <Plus className="size-5" aria-hidden />
            </span>
            {t('add_platform')}
          </Link>
        ) : null}
      </div>
    </section>
  );
}
