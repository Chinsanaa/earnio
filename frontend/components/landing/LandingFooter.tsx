'use client';

import Link from 'next/link';
import { useState } from 'react';
import { EarnioLogo } from '@/components/brand/EarnioLogo';
import { LegalDocumentModal } from '@/components/auth/LegalDocumentModal';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LandingContent } from '@/lib/landing/content';
import type { LegalDocumentSlug } from '@/lib/types/legal';

export function LandingFooter({ content }: { content: LandingContent }) {
  const { t } = useLanguage();
  const [legalSlug, setLegalSlug] = useState<LegalDocumentSlug | null>(null);

  const isBrand = content.audience === 'brand';

  return (
    <footer className="landing-footer border-t-2 border-[color:var(--outline)]">
      <div className="mx-auto grid max-w-7xl gap-10 px-6 py-14 sm:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr] lg:gap-8 lg:px-10">
        <div className="max-w-sm">
          <EarnioLogo href={content.homeHref} />
          <p className="mt-4 text-sm leading-relaxed text-landing-muted">
            {t(isBrand ? 'footer_description_brands' : 'footer_description_creators')}
          </p>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-landing-fg">{t('footer_column_product')}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            {content.navItems.map((item) =>
              item.type === 'scroll' ? (
                <li key={item.href}>
                  <a href={item.href} className="text-landing-muted transition hover:text-landing-fg">
                    {item.label}
                  </a>
                </li>
              ) : (
                <li key={item.href}>
                  <Link href={item.href} className="text-landing-muted transition hover:text-landing-fg">
                    {item.label}
                  </Link>
                </li>
              )
            )}
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-landing-fg">{t('footer_column_account')}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <Link href={content.loginHref} className="text-landing-muted transition hover:text-landing-fg">
                {t('log_in')}
              </Link>
            </li>
            <li>
              <Link href={content.signupHref} className="text-landing-muted transition hover:text-landing-fg">
                {content.signupCta}
              </Link>
            </li>
            <li>
              <Link
                href={content.switchAudience.href}
                className="text-landing-muted transition hover:text-landing-fg"
              >
                {content.switchAudience.label}
              </Link>
            </li>
          </ul>
        </div>

        <div>
          <h3 className="text-sm font-semibold text-landing-fg">{t('footer_column_legal')}</h3>
          <ul className="mt-4 space-y-3 text-sm">
            <li>
              <button
                type="button"
                onClick={() => setLegalSlug('privacy-policy')}
                className="text-landing-muted transition hover:text-landing-fg"
              >
                {t('privacy_policy')}
              </button>
            </li>
            <li>
              <button
                type="button"
                onClick={() => setLegalSlug('terms-and-conditions')}
                className="text-landing-muted transition hover:text-landing-fg"
              >
                {t('terms_and_conditions')}
              </button>
            </li>
          </ul>
        </div>
      </div>

      <div className="border-t-2 border-[color:var(--border)] px-6 py-6 lg:px-10">
        <p className="mx-auto max-w-7xl text-xs text-landing-muted">
          {t(isBrand ? 'footer_brands' : 'footer_creators')}
        </p>
      </div>

      <div className="landing-footer-wordmark" aria-hidden>
        Earnio
      </div>

      <LegalDocumentModal slug={legalSlug} onClose={() => setLegalSlug(null)} />
    </footer>
  );
}
