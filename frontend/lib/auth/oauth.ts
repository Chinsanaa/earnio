import { getSupabaseBrowserClient } from '@/lib/supabase/client';
import type { UserType } from '@/lib/types/auth';

export type OAuthProvider = 'google' | 'apple';

export async function startOAuthSignIn(provider: OAuthProvider, userType: UserType): Promise<void> {
  const supabase = getSupabaseBrowserClient();
  const params = new URLSearchParams({ user_type: userType });
  const redirectTo = `${window.location.origin}/auth/callback?${params.toString()}`;

  const { data, error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo,
      skipBrowserRedirect: true,
      queryParams: {
        user_type: userType,
      },
    },
  });

  if (error) {
    throw new Error(error.message);
  }

  if (!data.url) {
    throw new Error('Could not start social sign-in. Please try again.');
  }

  window.location.assign(data.url);
}
