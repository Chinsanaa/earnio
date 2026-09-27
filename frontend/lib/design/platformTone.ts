import type { PopTone } from './popTone';

/**
 * Solid Pop color for each creator platform, echoing its brand without copying it:
 * TikTok = sky (cyan), YouTube = coral (red), Instagram = lilac (purple/pink).
 */
const PLATFORM_TONES: Record<string, PopTone> = {
  tiktok: 'sky',
  youtube: 'coral',
  instagram: 'lilac',
};

export function platformTone(platform: string): PopTone {
  return PLATFORM_TONES[platform.toLowerCase()] ?? 'lime';
}
