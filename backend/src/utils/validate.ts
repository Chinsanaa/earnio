const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,30}$/;
const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export function isValidEmail(value: string): boolean {
  return EMAIL_RE.test(value) && value.length <= 254;
}

export function isValidUsername(value: string): boolean {
  return USERNAME_RE.test(value);
}

export function isValidUuid(value: string): boolean {
  return UUID_RE.test(value);
}

export function parsePositiveInt(
  value: unknown,
  options: { min?: number; max?: number } = {}
): number | null {
  const parsed = Number(value);
  if (!Number.isFinite(parsed) || !Number.isInteger(parsed)) {
    return null;
  }

  const { min = 1, max = Number.MAX_SAFE_INTEGER } = options;
  if (parsed < min || parsed > max) {
    return null;
  }

  return parsed;
}

export function trimString(value: unknown, maxLength: number): string | null {
  if (typeof value !== 'string') {
    return null;
  }

  const trimmed = value.trim();
  if (!trimmed || trimmed.length > maxLength) {
    return null;
  }

  return trimmed;
}

const DELIVERABLE_HOSTS = ['tiktok.com', 'youtube.com', 'youtu.be', 'instagram.com'];

/**
 * Returns the normalized URL when it is an https link to a supported platform
 * (TikTok, YouTube, Instagram), otherwise null.
 */
export function normalizeDeliverableUrl(value: unknown): string | null {
  const raw = trimString(value, 2048);
  if (!raw) {
    return null;
  }

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.username || url.password) {
    return null;
  }

  const host = url.hostname.toLowerCase();
  const allowed = DELIVERABLE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return allowed ? url.toString() : null;
}
