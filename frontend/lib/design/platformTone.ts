import type { DecorativeTint } from './tint';

/** Tile tint per creator platform. Kept to the two calm decorative tints on purpose. */
const PLATFORM_TINTS: Record<string, DecorativeTint> = {
  tiktok: 'slate',
  youtube: 'blue',
  instagram: 'slate',
};

export function platformTone(platform: string): DecorativeTint {
  return PLATFORM_TINTS[platform.toLowerCase()] ?? 'blue';
}
