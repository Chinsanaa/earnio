'use client';

import Link from 'next/link';
import { useLanguage } from '@/contexts/LanguageContext';

type ChooserMode = 'login' | 'signup';

const copy: Record<
  ChooserMode,
  {
    titleKey: string;
    questionKey: string;
    creatorHref: string;
    sponsorHref: string;
    switchHref: string;
    switchPromptKey: string;
    switchLabelKey: string;
  }
> = {
  login: {
    titleKey: 'sign_in',
    questionKey: 'how_are_you_using',
    creatorHref: '/login/creator',
    sponsorHref: '/login/sponsor',
    switchHref: '/signup',
    switchPromptKey: 'new_here',
    switchLabelKey: 'create_account',
  },
  signup: {
    titleKey: 'get_started',
    questionKey: 'how_will_you_use',
    creatorHref: '/signup/creator',
    sponsorHref: '/signup/sponsor',
    switchHref: '/login',
    switchPromptKey: 'already_have_account',
    switchLabelKey: 'sign_in',
  },
};

export function AccountTypeChooser({ mode }: { mode: ChooserMode }) {
  const c = copy[mode];
  const { t } = useLanguage();

  return (
    <div className="w-full max-w-md">
      <div className="auth-card p-8 sm:p-10">
        <div className="mb-6 flex h-10 w-10 items-center justify-center rounded-xl border-2 border-outline bg-tint-blue text-tint-foreground shadow-hard-sm">
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden>
            <path
              d="M3 12L21 4L14 21L11 13L3 12Z"
              fill="currentColor"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="text-2xl font-semibold text-landing-fg">{t(c.titleKey)}</h1>
        <p className="mt-6 text-center text-sm font-medium text-landing-fg">{t(c.questionKey)}</p>

        <div className="mt-6 space-y-3">
          <AccountTypeCard
            href={c.creatorHref}
            label={t('creator')}
            description={t('creator_description')}
          />
          <AccountTypeCard
            href={c.sponsorHref}
            label={t('sponsor')}
            description={t('sponsor_description')}
          />
        </div>

        <p className="mt-8 text-center text-sm text-landing-muted">
          {t(c.switchPromptKey)}{' '}
          <Link href={c.switchHref} className="auth-link">
            {t(c.switchLabelKey)}
          </Link>
        </p>
      </div>
    </div>
  );
}

function AccountTypeCard({
  href,
  label,
  description,
}: {
  href: string;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="pop-press group block rounded-xl border-2 border-outline bg-card p-5 text-left shadow-hard-sm"
    >
      <span className="text-base font-semibold text-landing-fg group-hover:text-landing-fg">
        {label}
      </span>
      <p className="mt-1.5 text-sm text-landing-muted">{description}</p>
    </Link>
  );
}
