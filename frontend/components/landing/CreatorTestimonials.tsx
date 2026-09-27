'use client';

import { CREATOR_TESTIMONIALS } from '@/lib/landing/content';
import { Reveal } from '@/components/ui/reveal';
import { useLanguage } from '@/contexts/LanguageContext';

const STICKERS = [
  { tone: 'bg-pop-mint', tilt: '-rotate-1' },
  { tone: 'bg-pop-sun', tilt: 'rotate-1' },
  { tone: 'bg-pop-coral', tilt: '-rotate-1' },
];

export function CreatorTestimonials() {
  const { t } = useLanguage();

  return (
    <section className="landing-section border-t-2 border-[color:var(--outline)] bg-card px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{t('creators_love_earnio')}</h2>
          <p className="mt-4 text-lg text-landing-muted">{t('join_hundreds')}</p>
        </Reveal>

        <div className="mt-16 grid gap-8 md:grid-cols-3">
          {CREATOR_TESTIMONIALS.map((item, i) => {
            const sticker = STICKERS[i % STICKERS.length];
            return (
              <Reveal key={item.name} delay={i * 0.08}>
                <figure
                  className={`flex h-full flex-col justify-between rounded-3xl border-2 border-pop-foreground p-7 text-pop-foreground shadow-hard ${sticker.tilt} ${sticker.tone}`}
                >
                  <blockquote className="font-display text-lg font-semibold leading-snug tracking-tight">
                    &ldquo;{item.quote}&rdquo;
                  </blockquote>
                  <figcaption className="mt-8 border-t-2 border-pop-foreground pt-4">
                    <p className="font-bold">{item.name}</p>
                    <p className="text-sm">{item.role}</p>
                  </figcaption>
                </figure>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
