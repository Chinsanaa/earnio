import { safeDeliverableHref } from '@/lib/deliverable';

/** Shows a submitted deliverable as a link only when the URL is a safe platform link. */
export function DeliverableLink({ url, className }: { url: string; className?: string }) {
  const href = safeDeliverableHref(url);
  if (!href) {
    return <span className="break-all">{url}</span>;
  }
  return (
    <a href={href} target="_blank" rel="noreferrer" className={`break-all ${className ?? ''}`}>
      {url}
    </a>
  );
}
