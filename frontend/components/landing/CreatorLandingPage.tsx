'use client';

import Link from 'next/link';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { CreatorFaq } from '@/components/landing/CreatorFaq';
import { CreatorFeatures } from '@/components/landing/CreatorFeatures';
import { CreatorTestimonials } from '@/components/landing/CreatorTestimonials';
import { HeroIllustration } from '@/components/landing/HeroIllustration';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { Marquee } from '@/components/landing/Marquee';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

export function CreatorLandingPage() {
  const baseContent = LANDING_CONTENT.creator;
  const { t } = useLanguage();

  const content = {
    ...baseContent,
    switchAudience: { label: t('for_brands'), href: '/brands' },
    signupCta: t('get_started'),
    navItems: [
      { type: 'scroll' as const, label: t('how_it_works'), href: '#how-it-works' },
      { type: 'scroll' as const, label: t('features'), href: '#features' },
      { type: 'scroll' as const, label: t('faq'), href: '#faq' },
    ],
  };

  return (
    <div className="landing-page flex min-h-full flex-col scroll-smooth">
      <LandingNav content={content} />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-12 lg:grid-cols-2 lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="max-w-xl">
            <p className="animate-fade-up mb-6 inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-pop-foreground bg-pop-lime px-4 py-1.5 text-sm font-bold text-pop-foreground shadow-hard-sm">
              ✦ {t('earn_more_create_more')}
            </p>
            <h1 className="landing-display animate-fade-up animate-fade-up-delay-1">
              {t('platform_for_mongolian_creators')}
            </h1>
            <p className="animate-fade-up animate-fade-up-delay-2 mt-6 text-lg leading-relaxed text-landing-muted sm:text-xl">
              {t('platform_for_mongolian_creators_subtitle')}
            </p>
            <div className="animate-fade-up animate-fade-up-delay-3 mt-10 flex flex-wrap gap-4">
              <Link
                href={content.signupHref}
                className="landing-btn-pop gap-2 px-8 py-3.5 text-[15px]"
              >
                {t('get_started')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
              <a href="#features" className="landing-btn-light px-8 py-3.5 text-[15px]">
                {t('explore_sponsorships')}
              </a>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <HeroIllustration metrics={content.illustrationMetrics} />
          </div>
        </section>

        <Marquee
          items={['TikTok', 'YouTube', 'Instagram', t('earn_more_create_more'), t('get_paid_mnt'), t('find_sponsorships')]}
        />

        <HowItWorks
          content={{
            ...content.howItWorks,
            title: t('how_earnio_works_for_creators'),
            subtitle: t('four_simple_steps'),
            steps: [
              { title: t('connect_platforms'), description: t('connect_platforms_desc') },
              { title: t('track_performance'), description: t('track_performance_desc') },
              { title: t('find_sponsorships'), description: t('find_sponsorships_desc') },
              { title: t('get_paid_mnt'), description: t('get_paid_mnt_desc') },
            ],
          }}
          signupHref={content.signupHref}
          signupCta={t('get_started')}
        />
        <CreatorFeatures />
        <CreatorTestimonials />
        <CreatorFaq />
      </main>

      <LandingFooter content={content} />
    </div>
  );
}
