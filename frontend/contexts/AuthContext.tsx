'use client';

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { useRouter } from 'next/navigation';
import * as api from '@/lib/api/client';
import { homePathForUserType } from '@/lib/auth/routes';
import { getNextPathFromWindow } from '@/lib/auth/navigation';
import { isAuthRoute } from '@/lib/auth/paths';
import {
  clearSessionCookies,
  getAccessToken,
  setUserTypeCookie,
} from '@/lib/auth/session';
import { clearSupabaseBrowserSession } from '@/lib/supabase/client';
import type { AuthUser, LoginRequest, SignupRequest } from '@/lib/types/auth';

interface AuthContextValue {
  user: AuthUser | null;
  loading: boolean;
  login: (payload: LoginRequest) => Promise<void>;
  signup: (payload: SignupRequest) => Promise<void>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<AuthUser | null>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);
  const refreshSeq = useRef(0);
  // Read through a ref so the mount-only session restore doesn't re-run when
  // the router object changes identity.
  const routerRef = useRef(router);
  useEffect(() => {
    routerRef.current = router;
  }, [router]);

  const refreshUser = useCallback(async (): Promise<AuthUser | null> => {
    const seq = ++refreshSeq.current;
    let token = getAccessToken();
    if (!token) {
      token = (await api.refreshAccessToken()) ? getAccessToken() : null;
    }
    if (seq !== refreshSeq.current) return null;
    if (!token) {
      setUser(null);
      return null;
    }
    try {
      const { user: profile } = await api.getMe();
      if (seq !== refreshSeq.current) return null;
      setUser(profile);
      setUserTypeCookie(profile.userType);
      return profile;
    } catch {
      if (seq !== refreshSeq.current) return null;
      clearSessionCookies();
      setUser(null);
      return null;
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const profile = await refreshUser();
      if (cancelled) return;
      setLoading(false);
      // The access cookie lasts an hour, so the edge proxy sends returning
      // users to /login. If the refresh cookie restored the session, carry on.
      if (profile && isAuthRoute(window.location.pathname)) {
        routerRef.current.replace(getNextPathFromWindow() ?? homePathForUserType(profile.userType));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [refreshUser]);

  const login = useCallback(
    async (payload: LoginRequest) => {
      refreshSeq.current += 1;
      await api.login(payload);
      const profile = await refreshUser();
      if (!profile) {
        throw new Error('Failed to load profile after login');
      }
      router.push(getNextPathFromWindow() ?? homePathForUserType(profile.userType));
      router.refresh();
    },
    [router, refreshUser]
  );

  const signup = useCallback(
    async (payload: SignupRequest) => {
      refreshSeq.current += 1;
      await api.signup(payload);
      const profile = await refreshUser();
      if (!profile) {
        throw new Error('Failed to load profile after signup');
      }
      try {
        sessionStorage.setItem('earnio-show-verify', '1');
      } catch {
        // ignore storage failures
      }
      router.push(getNextPathFromWindow() ?? homePathForUserType(profile.userType));
      router.refresh();
    },
    [router, refreshUser]
  );

  const logout = useCallback(async () => {
    refreshSeq.current += 1;
    await api.logout();
    await clearSupabaseBrowserSession();
    clearSessionCookies();
    setUser(null);
    router.push('/');
    router.refresh();
  }, [router]);

  const value = useMemo(
    () => ({ user, loading, login, signup, logout, refreshUser }),
    [user, loading, login, signup, logout, refreshUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return ctx;
}
