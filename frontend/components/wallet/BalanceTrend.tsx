import { formatMnt } from '@/lib/format';
import type { WalletTransaction } from '@/lib/types/wallet';

const CREDIT_TYPES = new Set(['sponsorship_credit', 'earning_credit', 'adjustment']);

function deltaFor(tx: WalletTransaction): number {
  if (CREDIT_TYPES.has(tx.type) && tx.status === 'completed') return tx.amount_mnt;
  if (tx.type === 'platform_fee' && tx.status === 'completed') return -tx.amount_mnt;
  if (tx.type === 'payout' && (tx.status === 'completed' || tx.status === 'pending')) {
    return -tx.amount_mnt;
  }
  return 0;
}

/** Running balance sparkline, drawn for the solid blue wallet hero (solid fills only). */
export function BalanceTrend({ transactions }: { transactions: WalletTransaction[] }) {
  const chronological = [...transactions].sort(
    (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
  );

  const points = chronological.reduce<number[]>((acc, tx) => {
    const previous = acc.length > 0 ? acc[acc.length - 1] : 0;
    acc.push(Math.max(0, previous + deltaFor(tx)));
    return acc;
  }, []);

  if (points.length === 0) {
    return (
      <div className="flex h-32 items-center justify-center text-sm text-[color:var(--hero-fg-muted)]">
        No transaction history yet
      </div>
    );
  }

  const max = Math.max(...points, 1);
  const min = Math.min(...points, 0);
  const range = Math.max(max - min, 1);
  const width = 100;
  const height = 100;

  const coords = points.map((value, i) => {
    const x = points.length === 1 ? width : (i / (points.length - 1)) * width;
    const y = height - ((value - min) / range) * height;
    return [x, y];
  });

  const linePath = coords.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x},${y}`).join(' ');
  const areaPath = `${linePath} L${width},${height} L0,${height} Z`;

  return (
    <div>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className="h-32 w-full overflow-visible"
      >
        <path d={areaPath} fill="var(--hero-divider)" />
        <path
          d={linePath}
          fill="none"
          stroke="var(--pop-lime)"
          strokeWidth="3"
          vectorEffect="non-scaling-stroke"
        />
      </svg>
      <div className="mt-2 flex justify-between font-mono text-xs text-[color:var(--hero-fg-muted)]">
        <span>{formatMnt(min)}</span>
        <span>{formatMnt(max)}</span>
      </div>
    </div>
  );
}
