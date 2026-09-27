'use client';

import Link from 'next/link';
import { LANDING_CONTENT } from '@/lib/landing/content';
import { HeroIllustration } from '@/components/landing/HeroIllustration';
import { HowItWorks } from '@/components/landing/HowItWorks';
import { LandingFooter } from '@/components/landing/LandingFooter';
import { LandingNav } from '@/components/landing/LandingNav';
import { Marquee } from '@/components/landing/Marquee';
import { ArrowRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

/** Brand landing — original hero + sections layout */
export function BrandLandingPage() {
  const baseContent = LANDING_CONTENT.brand;
  const { t } = useLanguage();

  const content = {
    ...baseContent,
    switchAudience: { label: t('for_creators'), href: '/' },
    signupCta: t('get_started'),
    navItems: [
      { type: 'link' as const, label: t('campaigns'), href: '/sponsor/campaigns' },
      { type: 'link' as const, label: t('home'), href: '/sponsor/dashboard' },
    ],
  };

  return (
    <div className="landing-page flex min-h-full flex-col">
      <LandingNav content={content} />

      <main>
        <section className="mx-auto grid max-w-7xl items-center gap-12 px-6 pb-16 pt-12 lg:grid-cols-2 lg:gap-8 lg:px-10 lg:pb-24 lg:pt-16">
          <div className="max-w-xl">
            <p className="animate-fade-up mb-6 inline-flex -rotate-2 items-center gap-2 rounded-full border-2 border-pop-foreground bg-pop-lilac px-4 py-1.5 text-sm font-bold text-pop-foreground shadow-hard-sm">
              ✦ {t('for_brands')}
            </p>
            <h1 className="landing-display animate-fade-up animate-fade-up-delay-1">
              {t('reach_mongolian_creators')}
            </h1>
            <p className="animate-fade-up animate-fade-up-delay-2 mt-6 text-lg leading-relaxed text-landing-muted sm:text-xl">
              {t('reach_mongolian_creators_subtitle')}
            </p>
            <div className="animate-fade-up animate-fade-up-delay-3 mt-10">
              <Link href={content.signupHref} className="landing-btn-pop gap-2 px-8 py-3.5 text-[15px]">
                {t('get_started')}
                <ArrowRight className="size-4" aria-hidden />
              </Link>
            </div>
          </div>

          <div className="relative lg:pl-8">
            <HeroIllustration metrics={content.illustrationMetrics} />
          </div>
        </section>

        <Marquee
          items={['TikTok', 'YouTube', 'Instagram', t('post_a_campaign'), t('review_applications'), t('track_results')]}
        />

        <HowItWorks
          content={{
            ...content.howItWorks,
            title: t('how_brand_partnerships_work'),
            subtitle: t('launch_campaigns_subtitle'),
            steps: [
              { title: t('create_your_account'), description: t('create_your_account_desc') },
              { title: t('post_a_campaign'), description: t('post_a_campaign_desc') },
              { title: t('review_applications'), description: t('review_applications_desc') },
              { title: t('track_results'), description: t('track_results_desc') },
            ],
          }}
          signupHref={content.signupHref}
          signupCta={t('get_started')}
        />
      </main>

      <LandingFooter content={content} />
    </div>
  );
}
