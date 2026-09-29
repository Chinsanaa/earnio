import React from 'react';

const VARIANTS = {
  card: { borderRadius: 'var(--radius-lg)', border: 'var(--border-width) solid var(--outline)', background: 'var(--card)', boxShadow: 'var(--shadow-hard-sm)' },
  elevated: { borderRadius: 'var(--radius-lg)', border: 'var(--border-width) solid var(--outline)', background: 'var(--card)', boxShadow: 'var(--shadow-hard)' },
  glass: { borderRadius: 'var(--radius-xl)', border: 'var(--border-width) solid var(--outline)', background: 'var(--card)', boxShadow: 'var(--shadow-hard-sm)' },
  hero: { borderRadius: 'var(--radius-2xl)', border: 'var(--border-width) solid var(--outline)', background: 'var(--card)', boxShadow: 'var(--shadow-hard)' },
};

/**
 * Surface container (solid fills only). `hero` adds the solid lime top-bar used on the
 * dashboard greeting card.
 */
export function Panel({ variant = 'card', padding = 20, className = '', style, children, ...rest }) {
  const v = VARIANTS[variant] || VARIANTS.card;
  return (
    <div
      className={className}
      style={{ position: 'relative', overflow: variant === 'hero' ? 'hidden' : undefined, padding, ...v, ...style }}
      {...rest}
    >
      {variant === 'hero' ? (
        <span aria-hidden style={{ position: 'absolute', insetInlineStart: 0, top: 0, width: '100%', height: 6, background: 'var(--tint-blue)', borderBottom: 'var(--border-width) solid var(--outline)' }} />
      ) : null}
      {children}
    </div>
  );
}
