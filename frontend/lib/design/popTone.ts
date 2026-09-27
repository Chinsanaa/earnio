/** Solid Pop accent names, matching the `--pop-*` tokens in app/globals.css. */
export const POP_TONES = ['sky', 'lilac', 'mint', 'sun', 'coral', 'lime'] as const;
export type PopTone = (typeof POP_TONES)[number];

/**
 * Picks a stable pop tone for a key (e.g. a sponsorship id), so the same card
 * always gets the same solid color block across renders and pages.
 */
export function popToneFor(key: string): PopTone {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return POP_TONES[Math.abs(hash) % POP_TONES.length];
}
