'use client';

import { BarChart3, Briefcase, PackageCheck, Wallet } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { useLanguage } from '@/contexts/LanguageContext';

export function CreatorFeatures() {
  const { t } = useLanguage();

  // Bento: one solid Earnio Blue anchor tile, then calm tints with ink text.
  const features = [
    { title: t('centralized_opportunities'), description: t('centralized_opportunities_desc'), icon: Briefcase, tone: 'bg-primary text-primary-foreground', span: 'md:col-span-2 md:row-span-2' },
    { title: t('payments_built_in'), description: t('payments_built_in_desc'), icon: Wallet, tone: 'bg-tint-slate text-tint-foreground', span: '' },
    { title: t('track_performance'), description: t('see_views_revenue'), icon: BarChart3, tone: 'bg-tint-blue text-tint-foreground', span: '' },
    { title: t('easy_delivery'), description: t('easy_delivery_desc'), icon: PackageCheck, tone: 'bg-tint-blue text-tint-foreground', span: 'md:col-span-3' },
  ];

  return (
    <section id="features" className="landing-section border-t-2 border-[color:var(--outline)] px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-7xl">
        <Reveal className="mx-auto max-w-2xl text-center">
          <h2 className="landing-section-title">{t('everything_creators_need')}</h2>
        </Reveal>

        <div className="mt-16 grid gap-5 md:grid-cols-3">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            const large = i === 0;
            return (
              <Reveal key={feature.title} delay={i * 0.06} className={feature.span}>
                <div
                  className={`flex h-full flex-col justify-between rounded-3xl border-2 border-outline p-7 shadow-hard transition-transform duration-200 hover:-translate-x-0.5 hover:-translate-y-0.5 motion-reduce:transform-none ${feature.tone} ${large ? 'min-h-72' : 'min-h-52'}`}
                >
                  <span className="flex size-12 items-center justify-center rounded-2xl border-2 border-outline bg-[color:var(--card)] text-[color:var(--foreground)]">
                    <Icon className="size-6" aria-hidden />
                  </span>
                  <div className="mt-8">
                    <h3 className={`font-display font-bold tracking-tight ${large ? 'text-3xl sm:text-4xl' : 'text-xl'}`}>
                      {feature.title}
                    </h3>
                    <p className={`mt-3 leading-relaxed ${large ? 'text-base' : 'text-sm'}`}>{feature.description}</p>
                  </div>
                </div>
              </Reveal>
            );
          })}
        </div>
      </div>
    </section>
  );
}
