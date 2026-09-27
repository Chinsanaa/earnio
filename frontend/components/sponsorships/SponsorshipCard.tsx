import Link from 'next/link';
import { applicationStatusLabel, contentTypeLabel, formatDate, formatMnt } from '@/lib/format';
import { useLanguage } from '@/contexts/LanguageContext';
import type { SponsorshipListing } from '@/lib/types/sponsorship';
import { popToneFor } from '@/lib/design/popTone';

export function SponsorshipCard({ sponsorship }: { sponsorship: SponsorshipListing }) {
  const title = sponsorship.title.replace(/^\[Demo\]\s*/, '');
  const brand = sponsorship.sponsor?.name ?? 'Brand partner';
  const { t } = useLanguage();

  return (
    <Link href={`/sponsorships/${sponsorship.id}`} className="creator-gig-card">
      <div className="creator-gig-thumb" data-tone={popToneFor(sponsorship.id)}>
        <span className="creator-gig-price">{formatMnt(sponsorship.payment_amount_mnt)}</span>
        <div className="flex h-full items-end p-4">
          <span className="rounded-full border-2 border-[color:var(--pop-foreground)] bg-[color:var(--card)] px-2.5 py-1 text-xs font-bold text-landing-fg">
            {contentTypeLabel(sponsorship.content_type)}
          </span>
        </div>
      </div>
      <div className="p-4">
        <p className="text-xs font-medium text-landing-muted">{brand}</p>
        <h3 className="mt-1 line-clamp-2 font-display text-lg font-bold leading-snug tracking-tight text-landing-fg">
          {title}
        </h3>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {sponsorship.hasApplied ? (
            <span className="badge-status-info">
              {applicationStatusLabel(sponsorship.applicationStatus ?? 'pending')}
            </span>
          ) : null}
          {sponsorship.deadline_apply ? (
            <span className="text-xs font-medium text-landing-muted">
              {t('apply_by').replace('{date}', formatDate(sponsorship.deadline_apply))}
            </span>
          ) : null}
        </div>
      </div>
    </Link>
  );
}
