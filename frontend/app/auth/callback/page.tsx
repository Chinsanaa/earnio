'use client';

import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { Suspense, useEffect, useState } from 'react';
import { completeOAuthSession } from '@/lib/api/client';
import { homePathForUserType } from '@/lib/auth/routes';
import { setAccessToken, setUserTypeCookie } from '@/lib/auth/session';
import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { UserType } from '@/lib/types/auth';

function parseUserType(value: string | null): UserType | undefined {
  if (value === 'creator' || value === 'sponsor') return value;
  return undefined;
}

function AuthCallbackContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    const supabase = getSupabaseBrowserClient();

    const oauthError = searchParams.get('error_description') ?? searchParams.get('error');
    if (oauthError) {
      setError(oauthError);
      return;
    }

    const userType = parseUserType(searchParams.get('user_type'));

    async function handleSession(accessToken: string, refreshToken: string) {
      try {
        const result = await completeOAuthSession({ accessToken, refreshToken, userType });

        try {
          const { Capacitor } = await import('@capacitor/core');
          if (Capacitor.isNativePlatform()) {
            const { Browser } = await import('@capacitor/browser');
            await Browser.close();
          }
        } catch {
          // ignore when browser plugin unavailable
        }

        if (cancelled) return;

        setAccessToken(result.accessToken);
        setUserTypeCookie(result.user.userType);
        router.replace(homePathForUserType(result.user.userType));
        router.refresh();
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : 'Social sign-in failed');
        }
      }
    }

    async function completeOAuth() {
      const code = searchParams.get('code');
      if (code) {
        const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code);
        if (cancelled) return;

        if (exchangeError) {
          setError(exchangeError.message);
          return;
        }

        if (data.session) {
          await handleSession(data.session.access_token, data.session.refresh_token);
          return;
        }
      }

      const { data, error: sessionError } = await supabase.auth.getSession();
      if (cancelled) return;

      if (sessionError) {
        setError(sessionError.message);
        return;
      }

      if (data.session) {
        await handleSession(data.session.access_token, data.session.refresh_token);
      }
    }

    void completeOAuth();

    return () => {
      cancelled = true;
    };
  }, [router, searchParams]);

  if (error) {
    return (
      <>
        <h1 className="text-xl font-semibold text-landing-fg">Sign-in failed</h1>
        <p className="mt-3 text-sm text-destructive-text">{error}</p>
        <Link href="/login" className="auth-link mt-6 inline-block text-sm">
          Back to sign in
        </Link>
      </>
    );
  }

  return (
    <>
      <h1 className="text-xl font-semibold text-landing-fg">Finishing sign-in…</h1>
      <p className="mt-3 text-sm text-landing-muted">Please wait while we connect your account.</p>
    </>
  );
}

export default function AuthCallbackPage() {
  return (
    <div className="landing-page auth-layout flex min-h-full items-center justify-center px-4">
      <div className="auth-card w-full max-w-md p-8 text-center sm:p-10">
        <Suspense
          fallback={
            <>
              <h1 className="text-xl font-semibold text-landing-fg">Finishing sign-in…</h1>
              <p className="mt-3 text-sm text-landing-muted">Please wait while we connect your account.</p>
            </>
          }
        >
          <AuthCallbackContent />
        </Suspense>
      </div>
    </div>
  );
}
