'use client';

import { useEffect, useRef, useState } from 'react';
import { animate, useInView, useReducedMotion } from 'motion/react';

/**
 * Counts up to `value` once it scrolls into view (Magic UI "Number Ticker"
 * pattern, rebuilt on Motion). Renders the final value immediately when the
 * user prefers reduced motion, so screen readers and screenshots never see 0.
 */
export function NumberTicker({
  value,
  format = (n) => Math.round(n).toLocaleString('en-US'),
  duration = 0.9,
  className,
}: {
  value: number;
  format?: (n: number) => string;
  duration?: number;
  className?: string;
}) {
  const ref = useRef<HTMLSpanElement>(null);
  const inView = useInView(ref, { once: true });
  const reduced = useReducedMotion();
  const [display, setDisplay] = useState(0);

  useEffect(() => {
    if (reduced || !inView) return;
    const controls = animate(0, value, {
      duration,
      ease: [0.22, 1, 0.36, 1],
      onUpdate: setDisplay,
    });
    return () => controls.stop();
  }, [inView, reduced, value, duration]);

  return (
    <span ref={ref} className={className} aria-label={format(value)}>
      <span aria-hidden>{format(reduced ? value : display)}</span>
    </span>
  );
}
