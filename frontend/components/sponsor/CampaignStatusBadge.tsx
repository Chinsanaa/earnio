import { campaignStatusLabel } from '@/lib/sponsor/campaignForm';

export function CampaignStatusBadge({ status }: { status: string }) {
  const styles: Record<string, string> = {
    active: 'border-outline bg-tint-green text-tint-foreground',
    closed: 'border-border-strong bg-card-muted text-foreground',
    draft: 'border-outline bg-tint-slate text-tint-foreground',
  };

  return (
    <span
      className={`inline-flex rounded-full border-[1.5px] px-2.5 py-0.5 text-xs font-bold uppercase tracking-wide ${styles[status] ?? styles.closed}`}
    >
      {campaignStatusLabel(status)}
    </span>
  );
}
