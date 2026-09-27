import Link from 'next/link';
import { ArrowUpRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buttonVariants } from '@/components/ui/button';
import { PlatformBadge } from '@/components/dashboard/PlatformBadge';
import { formatMnt, platformLabel, sourceLabel } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import type { EarningsEntry } from '@/lib/types/dashboard';

export function RecentEarnings({ data }: { data: EarningsEntry[] }) {
  const { t } = useLanguage();
  return (
    <Card className="py-4">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>{t('recent_earnings')}</CardTitle>
        <Link
          href="/wallet"
          className={buttonVariants({ variant: 'ghost', size: 'sm', className: 'text-muted-foreground' })}
        >
          {t('view_all')}
          <ArrowUpRight className="size-4" />
        </Link>
      </CardHeader>
      <CardContent>
        {data.length === 0 ? (
          <p className="text-sm text-muted">{t('no_earnings_yet')}</p>
        ) : (
          <div className="flex flex-col divide-y divide-border">
            {data.map((row) => (
              <div key={row.id} className="flex items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                <span className="inline-flex items-center gap-3">
                  <PlatformBadge platform={row.platform} size="sm" />
                  <span>
                    <span className="block text-sm font-medium">{platformLabel(row.platform)}</span>
                    <span className="block text-xs text-muted">
                      {sourceLabel(row.source_type)} · {formatPeriod(row.period_start, row.period_end)}
                    </span>
                  </span>
                </span>
                <span className="rounded-full border-2 border-pop-foreground bg-pop-mint px-2.5 py-0.5 font-mono text-sm font-bold text-pop-foreground">
                  +{formatMnt(row.amount_mnt)}
                </span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

function formatPeriod(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const opts: Intl.DateTimeFormatOptions = { month: 'short', year: 'numeric' };
  if (s.getMonth() === e.getMonth() && s.getFullYear() === e.getFullYear()) {
    return s.toLocaleDateString('en-US', opts);
  }
  return `${s.toLocaleDateString('en-US', { month: 'short' })} – ${e.toLocaleDateString('en-US', opts)}`;
}
