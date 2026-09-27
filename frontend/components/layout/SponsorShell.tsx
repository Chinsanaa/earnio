'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Plus } from 'lucide-react';
import { CreatorAppShell } from '@/components/layout/CreatorAppShell';
import { EmailVerificationPrompt } from '@/components/settings/EmailVerificationPrompt';
import { SPONSOR_SIDEBAR_NAV, isSponsorNavActive } from '@/components/layout/sponsor-nav';
import { useAuth } from '@/contexts/AuthContext';

const SPONSOR_COMMAND_ACTIONS = [
  { id: 'new-campaign', labelKey: 'new_campaign', href: '/sponsor/campaigns/new', icon: <Plus className="size-5" /> },
];

export function SponsorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.userType !== 'sponsor') {
      router.replace('/dashboard');
    }
  }, [user, loading, router]);

  return (
    <CreatorAppShell
      homeHref="/sponsor/dashboard"
      navItems={SPONSOR_SIDEBAR_NAV}
      isNavActive={isSponsorNavActive}
      settingsHref="/sponsor/settings"
      userName={user?.name}
      onLogout={() => logout()}
      commandActions={SPONSOR_COMMAND_ACTIONS}
    >
      <EmailVerificationPrompt />
      {children}
    </CreatorAppShell>
  );
}
