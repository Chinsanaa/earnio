import Link from 'next/link';
import { formatHandle, platformLabel } from '@/lib/format';
import type { PlatformAccount } from '@/lib/types/dashboard';

const SUPPORTED = ['tiktok', 'youtube'] as const;

export function PlatformStatusCard({ platforms }: { platforms: PlatformAccount[] }) {
  const connected = new Set(platforms.map((p) => p.platform.toLowerCase()));

  return (
    <div className="creator-panel">
      <h2 className="text-base font-semibold tracking-tight text-landing-fg">Platforms</h2>
      <p className="mt-1 text-sm text-landing-muted">
        {platforms.length > 0
          ? `${platforms.length} account${platforms.length === 1 ? '' : 's'} connected`
          : 'Connect accounts to sync earnings'}
      </p>

      <ul className="mt-4 space-y-3">
        {SUPPORTED.map((id) => {
          const account = platforms.find((p) => p.platform.toLowerCase() === id);
          const isConnected = connected.has(id);
          return (
            <li key={id} className="creator-platform-row">
              <div className="flex items-center gap-3">
                <span className="flex h-10 w-10 items-center justify-center rounded-xl border-2 border-pop-foreground bg-pop-sky text-xs font-bold text-pop-foreground">
                  {id === 'tiktok' ? 'TT' : 'YT'}
                </span>
                <div>
                  <p className="font-medium text-landing-fg">{platformLabel(id)}</p>
                  <p className="text-sm text-landing-muted">
                    {isConnected && account ? formatHandle(account.platform_username) : 'Not connected'}
                  </p>
                </div>
              </div>
              <Link href="/platforms" className="landing-btn-light px-4 py-2 text-xs">
                {isConnected ? 'Manage' : 'Connect'}
              </Link>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
