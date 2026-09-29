'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
import { EarnioLogo } from '@/components/brand/EarnioLogo';
import { NotificationBell } from '@/components/notifications/NotificationBell';
import { ThemeToggle } from '@/components/ui/ThemeToggle';
import { LanguageSwitcher } from '@/components/ui/LanguageSwitcher';
import { useLanguage } from '@/contexts/LanguageContext';

export interface NavItem {
  href: string;
  label: string;
}

interface AppShellProps {
  children: React.ReactNode;
  navItems: NavItem[];
  homeHref: string;
  badge?: React.ReactNode;
  userLabel?: string;
  onLogout: () => void;
  showNotifications?: boolean;
}

function isActive(pathname: string, href: string): boolean {
  if (href === '/dashboard' || href === '/sponsor/dashboard') {
    return pathname === href;
  }
  return pathname === href || pathname.startsWith(`${href}/`);
}

export function AppShell({
  children,
  navItems,
  homeHref,
  badge,
  userLabel,
  onLogout,
  showNotifications = false,
}: AppShellProps) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);
  const { t } = useLanguage();

  const linkClass = (href: string) =>
    `nav-link ${isActive(pathname, href) ? 'nav-link-active' : 'nav-link-inactive'}`;

  return (
    <div className="flex min-h-full flex-col">
      <header className="sticky top-0 z-40 border-b-2 border-[color:var(--outline)] bg-card">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3">
          <div className="flex min-w-0 items-center gap-3">
            <button
              type="button"
              className="flex h-11 w-11 shrink-0 cursor-pointer items-center justify-center rounded-xl border border-[color:var(--border)] bg-[color:var(--card-muted)] md:hidden"
              aria-label={t('open_menu')}
              aria-expanded={menuOpen}
              onClick={() => setMenuOpen((o) => !o)}
            >
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                {menuOpen ? (
                  <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                ) : (
                  <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
                )}
              </svg>
            </button>
            <Link href={homeHref} className="truncate">
              <EarnioLogo iconClassName="h-7 w-7" />
            </Link>
            {badge}
          </div>

          <nav className="hidden items-center gap-1 md:flex">
            {navItems.map((item) => (
              <Link key={item.href} href={item.href} className={linkClass(item.href)}>
                {item.label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <ThemeToggle />
            {showNotifications && <NotificationBell />}
            {userLabel && (
              <span className="hidden max-w-[120px] truncate rounded-lg bg-[color:var(--card-muted)] px-2.5 py-1 text-sm font-medium text-[color:var(--muted-foreground)] lg:inline">
                {userLabel}
              </span>
            )}
            <button
              type="button"
              onClick={onLogout}
              className="btn-secondary hidden min-h-11 sm:inline-flex"
            >
              {t('log_out')}
            </button>
          </div>
        </div>

        {menuOpen && (
          <nav className="border-t border-[color:var(--border)]/60 px-4 py-3 md:hidden">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className={`${linkClass(item.href)} block`}
                onClick={() => setMenuOpen(false)}
              >
                {item.label}
              </Link>
            ))}
            <button
              type="button"
              onClick={() => {
                setMenuOpen(false);
                onLogout();
              }}
              className="btn-secondary mt-2 w-full"
            >
              {t('log_out')}
            </button>
          </nav>
        )}
      </header>

      <main className="page-enter mx-auto w-full max-w-6xl flex-1 px-5 py-6 pb-24 md:py-8 md:pb-8">
        {children}
      </main>

      <nav
        className="fixed bottom-0 left-0 right-0 z-40 border-t-2 border-[color:var(--outline)] bg-card md:hidden"
        aria-label="Mobile navigation"
        style={{ paddingBottom: 'env(safe-area-inset-bottom, 0px)' }}
      >
        <div className="mx-auto flex max-w-lg justify-around px-2 py-2">
          {navItems.map((item) => {
            const active = isActive(pathname, item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`flex min-h-12 min-w-12 flex-col items-center justify-center rounded-xl px-2 text-[10px] font-semibold transition ${
                  active
                    ? 'text-[color:var(--primary)]'
                    : 'text-[color:var(--muted)]'
                }`}
              >
                <span
                  className={`mb-0.5 h-1 w-6 rounded-full transition ${
                    active ? 'bg-[color:var(--primary)]' : 'bg-transparent'
                  }`}
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}
