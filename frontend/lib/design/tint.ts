/**
 * Calm tint names, matching the `--tint-*` tokens in app/globals.css.
 * Green and red carry meaning (success / danger); only blue and slate are decorative.
 */
export type Tint = 'blue' | 'slate' | 'green' | 'red';

/** Tints allowed for decoration (card headers, tiles). Never green/red, which signal status. */
export const DECORATIVE_TINTS = ['blue', 'slate'] as const satisfies readonly Tint[];
export type DecorativeTint = (typeof DECORATIVE_TINTS)[number];

/**
 * Picks a stable decorative tint for a key (e.g. a sponsorship id), so the same
 * card always gets the same header color across renders and pages.
 */
export function tintFor(key: string): DecorativeTint {
  let hash = 0;
  for (let i = 0; i < key.length; i++) {
    hash = (hash * 31 + key.charCodeAt(i)) | 0;
  }
  return DECORATIVE_TINTS[Math.abs(hash) % DECORATIVE_TINTS.length];
}
