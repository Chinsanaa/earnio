'use client';

import Link from 'next/link';
import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { EarnioLogo } from '@/components/brand/EarnioLogo';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { useLanguage } from '@/contexts/LanguageContext';
import type { LandingContent, LandingNavItem } from '@/lib/landing/content';

function ChevronDown() {
  return (
    <svg className="h-3.5 w-3.5 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
    </svg>
  );
}

function ExternalIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

function NavItemLink({
  item,
  showChevron,
  onNavigate,
  className,
}: {
  item: LandingNavItem;
  showChevron: boolean;
  onNavigate?: () => void;
  className: string;
}) {
  if (item.type === 'scroll') {
    return (
      <a href={item.href} className={className} onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} className={className} onClick={onNavigate}>
      {item.label}
      {showChevron ? <ChevronDown /> : null}
    </Link>
  );
}

export function LandingNav({ content }: { content: LandingContent }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mounted, setMounted] = useState(false);
  const { t } = useLanguage();

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (!mobileOpen) return;

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') setMobileOpen(false);
    }

    window.addEventListener('keydown', onKeyDown);
    return () => {
      document.body.style.overflow = previousOverflow;
      window.removeEventListener('keydown', onKeyDown);
    };
  }, [mobileOpen]);

  const navLinkClass =
    'flex cursor-pointer items-center gap-1 rounded-lg px-3 py-2 text-[14px] font-medium text-landing-fg/80 transition-colors hover:text-landing-fg';
  const mobileNavLinkClass =
    'flex w-full items-center rounded-xl px-4 py-3 text-[15px] font-semibold text-landing-fg transition-colors hover:bg-pop-lime hover:text-pop-foreground';

  return (
    <header className="landing-nav sticky top-0 z-50">
      <div className="mx-auto flex max-w-7xl items-center justify-between gap-3 px-4 py-3.5 sm:px-6 sm:py-4 lg:px-10">
        <Link href={content.homeHref} className="shrink-0">
          <EarnioLogo iconClassName="h-7 w-7" />
        </Link>

        <nav className="hidden items-center gap-1 lg:flex" aria-label="Main navigation">
          {content.navItems.map((item) => (
            <NavItemLink
              key={item.href}
              item={item}
              showChevron={content.showNavChevron}
              className={navLinkClass}
            />
          ))}
        </nav>

        <div className="flex items-center gap-2 sm:gap-4">
          <LanguageSwitcher />
          <ThemeToggle />
          <Link
            href={content.switchAudience.href}
            className="hidden items-center gap-1.5 text-[14px] font-medium text-landing-fg/80 transition-colors hover:text-landing-fg md:inline-flex"
          >
            {content.switchAudience.label}
            <ExternalIcon />
          </Link>
          <Link
            href={content.loginHref}
            className="hidden text-[14px] font-medium text-landing-fg/80 transition-colors hover:text-landing-fg md:inline"
          >
            {t('log_in')}
          </Link>
          <Link href={content.signupHref} className="landing-btn-dark px-4 py-2 text-[13px] sm:px-5 sm:py-2.5 sm:text-[14px]">
            {content.signupCta}
          </Link>
          <button
            type="button"
            className="landing-menu-btn lg:hidden"
            aria-label={mobileOpen ? t('close_menu') : t('open_menu')}
            aria-expanded={mobileOpen}
            aria-controls="landing-mobile-menu"
            onClick={() => setMobileOpen((open) => !open)}
          >
            {mobileOpen ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {mounted &&
        createPortal(
          <div
            id="landing-mobile-menu"
            className={`landing-mobile-menu lg:hidden ${mobileOpen ? 'landing-mobile-menu-open' : ''}`}
            aria-hidden={!mobileOpen}
          >
            <button
              type="button"
              className="landing-mobile-menu-backdrop"
              aria-label={t('close_menu')}
              onClick={() => setMobileOpen(false)}
            />
            <div className="landing-mobile-menu-panel">
              <nav className="flex flex-col gap-1 p-4" aria-label="Mobile navigation">
                {content.navItems.map((item) => (
                  <NavItemLink
                    key={item.href}
                    item={item}
                    showChevron={false}
                    onNavigate={() => setMobileOpen(false)}
                    className={mobileNavLinkClass}
                  />
                ))}
              </nav>
              <div className="border-t-2 border-[color:var(--border)] p-4">
                <Link
                  href={content.switchAudience.href}
                  className={`${mobileNavLinkClass} gap-2`}
                  onClick={() => setMobileOpen(false)}
                >
                  {content.switchAudience.label}
                  <ExternalIcon />
                </Link>
                <Link
                  href={content.loginHref}
                  className={mobileNavLinkClass}
                  onClick={() => setMobileOpen(false)}
                >
                  {t('log_in')}
                </Link>
              </div>
            </div>
          </div>,
          document.body
        )}
    </header>
  );
}
