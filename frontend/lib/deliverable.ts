const DELIVERABLE_HOSTS = ['tiktok.com', 'youtube.com', 'youtu.be', 'instagram.com'];

/**
 * Mirrors the backend's normalizeDeliverableUrl: returns the URL only when it
 * is an https link to TikTok, YouTube or Instagram, so it is safe to use as an
 * href. Anything else returns null and should be shown as plain text.
 */
export function safeDeliverableHref(value: string | null | undefined): string | null {
  const raw = value?.trim();
  if (!raw) return null;

  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return null;
  }

  if (url.protocol !== 'https:' || url.username || url.password) return null;

  const host = url.hostname.toLowerCase();
  const allowed = DELIVERABLE_HOSTS.some((h) => host === h || host.endsWith(`.${h}`));
  return allowed ? url.toString() : null;
}
