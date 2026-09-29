/**
 * Solid lime ticker band (Magic UI "Marquee" pattern, CSS-only).
 * The list is rendered twice so the loop is seamless; the copy is aria-hidden.
 */
export function Marquee({ items }: { items: string[] }) {
  const row = (hidden: boolean) => (
    <ul className="pop-marquee-row" aria-hidden={hidden || undefined}>
      {items.map((item, i) => (
        <li key={`${item}-${i}`} className="pop-marquee-item">
          <span>{item}</span>
          <span aria-hidden className="pop-marquee-star">
            ✦
          </span>
        </li>
      ))}
    </ul>
  );

  return (
    <div className="pop-marquee">
      <div className="pop-marquee-track">
        {row(false)}
        {row(true)}
      </div>
    </div>
  );
}
