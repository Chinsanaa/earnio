const ICONS = {
  trend: (
    <path d="M3 17l6-6 4 4 8-8M21 7h-5M21 7v5" />
  ),
  wallet: (
    <>
      <path d="M19 7V5a2 2 0 0 0-2-2H5a2 2 0 0 0 0 4h14a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5" />
      <path d="M16 12h.01" />
    </>
  ),
  check: <path d="M20 6 9 17l-5-5" />,
} as const;

function Icon({ name, strokeWidth = 1.9 }: { name: keyof typeof ICONS; strokeWidth?: number }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth}
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[15px] w-[15px]"
      aria-hidden
    >
      {ICONS[name]}
    </svg>
  );
}

function Chip({
  className,
  icon,
  label,
  tone = 'blue',
  delay,
}: {
  className?: string;
  icon: keyof typeof ICONS;
  label: string;
  tone?: 'blue' | 'green';
  delay?: string;
}) {
  const toneClass = { blue: 'bg-tint-blue', green: 'bg-tint-green' }[tone];
  return (
    <div
      className={`landing-float absolute flex items-center gap-2 rounded-full border-2 border-outline px-3.5 py-2 text-tint-foreground shadow-hard-sm ${toneClass} ${className ?? ''}`}
      style={delay ? { animationDelay: delay } : undefined}
    >
      <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-full border-2 border-outline bg-[color:var(--card)] text-[color:var(--foreground)]">
        <Icon name={icon} />
      </span>
      <span className="font-mono text-[13px] font-bold">{label}</span>
    </div>
  );
}

const BARS = [38, 52, 44, 66, 58, 80, 72, 96];

const PLATFORM_ICONS = {
  tiktok: (
    <path d="M16.6 5.8a4.4 4.4 0 0 1-3.1-1.3v8.4a4.6 4.6 0 1 1-3.9-4.5v2.2a2.4 2.4 0 1 0 1.7 2.3V2h2.2a4.4 4.4 0 0 0 3.1 3.8z" />
  ),
  youtube: (
    <>
      <path d="M21.6 7.2a2.7 2.7 0 0 0-1.9-1.9C18 4.8 12 4.8 12 4.8s-6 0-7.7.5A2.7 2.7 0 0 0 2.4 7.2 28 28 0 0 0 2 12a28 28 0 0 0 .4 4.8 2.7 2.7 0 0 0 1.9 1.9c1.7.5 7.7.5 7.7.5s6 0 7.7-.5a2.7 2.7 0 0 0 1.9-1.9A28 28 0 0 0 22 12a28 28 0 0 0-.4-4.8z" />
      <path d="M10 9.5l5 2.5-5 2.5z" fill="currentColor" stroke="none" />
    </>
  ),
  instagram: (
    <>
      <rect x="3" y="3" width="18" height="18" rx="5" />
      <circle cx="12" cy="12" r="3.5" />
      <circle cx="17.2" cy="6.8" r="1" fill="currentColor" stroke="none" />
    </>
  ),
};

function PlatformIcon({ name }: { name: keyof typeof PLATFORM_ICONS }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-[18px] w-[18px]"
      aria-hidden
    >
      {PLATFORM_ICONS[name]}
    </svg>
  );
}

export function HeroIllustration({
  metrics = ['2.4M', '890K', '₮12M'],
}: {
  metrics?: [string, string, string];
}) {
  return (
    <div className="relative mx-auto flex min-h-[420px] w-full max-w-[520px] items-center justify-center lg:max-w-none">
      {/* Orbital paths */}
      <svg
        className="pointer-events-none absolute inset-0 h-full w-full text-[color:var(--border-strong)]"
        viewBox="0 0 400 400"
        fill="none"
        aria-hidden
      >
        <ellipse cx="200" cy="200" rx="172" ry="118" stroke="currentColor" strokeWidth="1.2" strokeDasharray="3 9" />
        <ellipse
          cx="200"
          cy="200"
          rx="120"
          ry="78"
          stroke="currentColor"
          strokeWidth="1.2"
          strokeDasharray="3 9"
          transform="rotate(-12 200 200)"
        />
      </svg>

      {/* Earnings stat card */}
      <div className="relative w-[300px] -rotate-2 rounded-3xl border-2 border-outline bg-card p-6 shadow-hard-lg">
        <div className="flex items-center justify-between">
          <span className="text-[13px] font-semibold text-muted-foreground">This month</span>
          <span className="inline-flex items-center gap-1 rounded-full border-[1.5px] border-outline bg-tint-blue px-2 py-0.5 font-mono text-[12px] font-bold text-tint-foreground">
            ▲ 18.2%
          </span>
        </div>
        <div className="mt-1.5 font-mono text-[32px] font-bold tracking-[-0.02em] text-landing-fg">
          ₮2,480,000
        </div>
        <div className="mt-[18px] flex h-14 items-end gap-1.5">
          {BARS.map((h, i) => (
            <div
              key={i}
              className={`flex-1 rounded-[5px] border-2 border-outline ${i === BARS.length - 1 ? 'bg-primary' : 'bg-primary-soft'}`}
              style={{ height: `${h}%` }}
            />
          ))}
        </div>
        <div className="mt-[18px] flex items-center gap-3.5 text-muted-foreground">
          <PlatformIcon name="tiktok" />
          <PlatformIcon name="youtube" />
          <PlatformIcon name="instagram" />
          <span className="ml-auto text-[12px] font-semibold text-muted-foreground">3 connected</span>
        </div>
      </div>

      <Chip className="left-[0%] top-[6%] -rotate-3" icon="trend" label={`${metrics[0]} views`} tone="blue" delay="0s" />
      <Chip className="right-[-2%] top-[12%] rotate-2" icon="wallet" label={`${metrics[2]} earned`} tone="blue" delay="0.5s" />
      <Chip className="bottom-[8%] left-[6%] rotate-1" icon="check" label="Payout sent" tone="green" delay="1s" />
    </div>
  );
}
