'use client';

import { Plus } from 'lucide-react';
import { Reveal } from '@/components/ui/reveal';
import { useLanguage } from '@/contexts/LanguageContext';

export function CreatorFaq() {
  const { t } = useLanguage();

  const faq = [
    { question: t('faq_signup_q'), answer: t('faq_signup_a') },
    { question: t('faq_who_can_join_q'), answer: t('faq_who_can_join_a') },
    { question: t('faq_payments_q'), answer: t('faq_payments_a') },
    { question: t('faq_multiple_brands_q'), answer: t('faq_multiple_brands_a') },
  ];

  return (
    <section id="faq" className="landing-section px-6 py-24 lg:px-10">
      <div className="mx-auto max-w-3xl">
        <Reveal className="text-center">
          <h2 className="landing-section-title">{t('have_questions')}</h2>
        </Reveal>

        <div className="mt-12 space-y-3">
          {faq.map((item) => (
            <details
              key={item.question}
              className="landing-feature-card landing-faq-item group rounded-2xl px-6 py-4"
            >
              <summary className="cursor-pointer list-none text-base font-bold marker:content-none [&::-webkit-details-marker]:hidden">
                <span className="flex items-center justify-between gap-4">
                  {item.question}
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full border-2 border-current transition-transform duration-200 group-open:rotate-45 motion-reduce:transition-none">
                    <Plus className="size-4" aria-hidden />
                  </span>
                </span>
              </summary>
              <p className="mt-4 text-sm leading-relaxed">{item.answer}</p>
            </details>
          ))}
        </div>
      </div>
    </section>
  );
}
