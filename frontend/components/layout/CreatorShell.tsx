'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';
import { Banknote, Send } from 'lucide-react';
import { CreatorAppShell } from '@/components/layout/CreatorAppShell';
import { EmailVerificationPrompt } from '@/components/settings/EmailVerificationPrompt';
import { useAuth } from '@/contexts/AuthContext';

const CREATOR_COMMAND_ACTIONS = [
  { id: 'request-payout', labelKey: 'request_payout', href: '/wallet', icon: <Banknote className="size-5" /> },
  { id: 'my-applications', labelKey: 'my_applications', href: '/sponsorships/applications', icon: <Send className="size-5" /> },
];

export function CreatorShell({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  useEffect(() => {
    if (loading || !user) return;
    if (user.userType === 'sponsor') {
      router.replace('/sponsor/dashboard');
    }
  }, [user, loading, router]);

  return (
    <CreatorAppShell
      userName={user?.name}
      userHandle={user?.username}
      onLogout={() => logout()}
      commandActions={CREATOR_COMMAND_ACTIONS}
    >
      <EmailVerificationPrompt />
      {children}
    </CreatorAppShell>
  );
}
