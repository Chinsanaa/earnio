import React from 'react';

/**
 * Track + fill progress bar. Used for onboarding plans, platform shares, and
 * campaign budgets. `pop` switches the fill to solid lime (Solid Pop, no gradients).
 */
export function ProgressBar({ value = 0, max = 100, height = 8, pop = false, color, trackColor, className = '', style, ...rest }) {
  const pct = Math.max(0, Math.min(100, (value / max) * 100));
  return (
    <div
      className={className}
      role="progressbar"
      aria-valuenow={value}
      aria-valuemin={0}
      aria-valuemax={max}
      style={{ width: '100%', height, borderRadius: 'var(--radius-full)', background: trackColor || 'var(--surface)', overflow: 'hidden', ...style }}
      {...rest}
    >
      <div
        style={{
          width: `${pct}%`, height: '100%', borderRadius: 'var(--radius-full)',
          background: pop ? 'var(--pop-lime)' : (color || 'var(--primary)'),
          transition: 'width var(--dur-slow) var(--ease-out)',
        }}
      />
    </div>
  );
}
