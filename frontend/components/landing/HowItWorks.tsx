import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import type { LandingContent } from '@/lib/landing/content';

const STEP_TONES = ['bg-tint-blue', 'bg-tint-slate'];

export function HowItWorks({
  content,
  signupHref,
  signupCta,
}: {
  content: LandingContent['howItWorks'];
  signupHref: string;
  signupCta: string;
}) {
  return (
    <section id={content.id} className="landing-section px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{content.title}</h2>
          <p className="mt-4 text-lg text-landing-muted">{content.subtitle}</p>
        </Reveal>

        <ol className="mt-16 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {content.steps.map((step, i) => (
            <Reveal key={step.title} delay={i * 0.08} className="h-full">
              <li className="landing-feature-card flex h-full flex-col rounded-3xl p-6">
                <span
                  className={`flex size-12 items-center justify-center rounded-2xl border-2 border-outline font-mono text-lg font-bold text-tint-foreground shadow-hard-sm ${STEP_TONES[i % STEP_TONES.length]}`}
                >
                  {String(i + 1).padStart(2, '0')}
                </span>
                <h3 className="mt-6 font-display text-xl font-bold tracking-tight text-landing-fg">{step.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-landing-muted">{step.description}</p>
              </li>
            </Reveal>
          ))}
        </ol>

        <div className="mt-16 flex flex-wrap items-center justify-center gap-4">
          <Link href={signupHref} className="landing-btn-dark gap-2 px-8 py-3.5 text-[15px]">
            {signupCta}
            <ArrowRight className="size-4" aria-hidden />
          </Link>
        </div>
      </div>
    </section>
  );
}
